const express = require("express");
const { pool } = require("./data/data");
const jwt = require("jsonwebtoken");

const app = express();

app.use(express.json());

app.listen(8080, () =>{
  console.log("O servidor esta ativo!");
});

app.get("/", async (req, res) => {
  res.send('<h1>Home Page!</h1>')
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const client = await pool.connect();

    // Verificar se esse email existe
    const findUser = await client.query(`SELECT * FROM users where email='${email}'`);
    if (!findUser || findUser.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não existe!' });
    }

    // Verificar se a senha está correta.
    if (findUser.rows[0].password !== password) {
      return res.status(401).json({ error: 'Senha incorreta!' });
    }

    const { id, name } = findUser.rows[0]
    return res.status(200).json({
      user: {
        id,
        name,
        email,
      },
      token: jwt.sign({ id }, 'sua_chave_secreta', {
        expiresIn: '1h',
      }),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor!' });
  }
});

app.get("/users", async (req, res) => {
  try {
      const client = await pool.connect();
      const { rows } = await client.query("SELECT * FROM Users");
      console.table(rows);
      res.status(200).send(rows);
  } catch (error) {
      console.error(error);
      res.status(500).send("Erro de conexão com o servidor");
  }
});
