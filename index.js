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

app.post('/users', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!password || !name) {
      return res.status(400).json({ error: "Os campos 'senha' e 'nome' são obrigatórios!" });
    }

    const client = await pool.connect();

    // Verificar se o usuário já existe
    const findUser = await client.query(`SELECT * FROM users WHERE email='${email}'`);
    if (findUser.rows.length > 0) {
      return res.status(409).json({ error: 'Este email já está em uso!' });
    }

    // Inserir o novo usuário no banco de dados
    const result = await client.query(
      `INSERT INTO users (name, email, password) VALUES ('${name}', '${email}', '${password}') RETURNING id`
    );

    const { id: userId } = result.rows[0];

    // Gerar um token para o novo usuário
    const token = jwt.sign({ id: userId }, 'sua_chave_secreta', { expiresIn: '1h' });

    return res.status(201).json({
      user: {
        id: userId,
        name,
        email,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro interno do servidor!' });
  }
});

app.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    const client = await pool.connect();

    // Verificar se o usuário existe
    const findUser = await client.query(`SELECT * FROM users WHERE id = ${id}`);
    if (!findUser.rows[0]) {
      return res.status(404).json({ error: 'Usuário não encontrado!' });
    }

    // Atualizar os campos informados (nome, email ou senha)
    let updateQuery = 'UPDATE users SET';
    if (name) {
      updateQuery += ` name = '${name}',`;
    }
    if (email) {
      updateQuery += ` email = '${email}',`;
    }
    if (password) {
      updateQuery += ` password = '${password}',`;
    }
    // Remover a última vírgula da query
    updateQuery = updateQuery.slice(0, -1);

    // Adicionar a condição para atualizar apenas o usuário com o id informado
    updateQuery += ` WHERE id = ${id}`;

    // Executar a atualização
    await client.query(updateQuery);
    return res.status(200).json({ message: 'Usuário atualizado com sucesso!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor!' });
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (id <= 0 || isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido!' });
    }

    const client = await pool.connect();
    
    // Verificar se o usuário existe
    const findUser = await client.query(`SELECT * FROM users where id=${id}`);
    if (!findUser.rows[0]) {
      return res.status(404).json({ error: 'Usuário não encontrado!' });
    }

    // Excluir o usuário do banco de dados
    await client.query(`DELETE FROM users WHERE id=${id}`);

    return res.status(200).json({ message: 'Usuário excluído com sucesso!' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno do servidor!' });
  }
});
