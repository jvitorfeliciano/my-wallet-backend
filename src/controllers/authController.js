import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { sessionsCollection, usersCollection } from "../database/db.js";

export async function postSignUp(req, res) {
  const { name, email, password } = req.body;

  try {
    const users = await usersCollection.findOne({ email });

    if (users) {
      return res.status(409).send({ message: "Usuário já cadastrado" });
    }

    const encryptedPassword = bcrypt.hashSync(password, 10);
    await usersCollection.insertOne({
      name,
      email,
      password: encryptedPassword,
    });

    return res.status(201).send({ message: "Usuário cadastrado om sucesso" });
  } catch (err) {
    return res.status(500).send({ message: "Erro do servidor" });
  }
}

export async function postSignIn(req, res) {
  const { email, password } = req.body;

  try {
    const user = await usersCollection.findOne({ email });

    if (user && bcrypt.compareSync(password, user.password)) {
      const isThereToken = await sessionsCollection.findOne({
        userId: user._id,
      });
      if (isThereToken) {
        return res.status(409).send({ message: "Você já está logado em um aparelho" });
      }

      const token = uuidv4();
      await sessionsCollection.insertOne({ token, userId: user._id });
      return res.status(200).send({ token: token, name: user.name });
    } else {
      return res.status(401).send({ message: "Email ou senha incorretos" });
    }
  } catch (err) {
    return res.status(500).send({ message: "Erro do servidor" });
  }
}

export default async function deleteSession(req, res) {
  const userId = req.userId;
  try {
    await sessionsCollection.deleteOne({ userId });
    return res.status(200).send({ message: "Sessão deletada com sucesso" });
  } catch (err) {
    return res.status(500).send({ message: "Erro do servidor" });
  }
}
