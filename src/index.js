const { response } = require('express')
const express = require('express')
const { v4: uuidv4 } = require('uuid')

const app = express()
app.use(express.json())
const customers = []

// Middleware
function confirmAccountCPF(req, res, next) {
  const { cpf } = req.headers
  const customer = customers.find(customer => customer.cpf === cpf)
  if (!customer) {
    return res.status(401).send('Customer not found')
  }

  req.customer = customer

  return next()
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount
    } else {
      return acc - operation.amount
    }
  }, 0)
  return balance
}

app.post('/account', (req, res) => {
  const { cpf, name } = req.body

  const cpfExists = customers.some(customer => customer.cpf === cpf)

  if (cpfExists) {
    return res.status(401).send('CPF JÁ EXISTENTE')
  } else {
    customers.push({
      cpf,
      name,
      id: uuidv4(),
      statement: []
    })

    return res.status(201).send(customers)
  }
})

//app.use(confirmAccountCPF)

app.get('/statement', confirmAccountCPF, (req, res) => {
  const { customer } = req
  return res.status(200).send(customer.statement)
})

app.post('/deposit', confirmAccountCPF, (req, res) => {
  const { descripton, amount } = req.body
  const { customer } = req
  const statementOperation = {
    descripton,
    amount,
    createdAt: new Date(),
    type: 'credit'
  }

  customer.statement.push(statementOperation)

  return res.status(201).send('Deposito realizado com sucesso')
})

app.post('/withdraw', confirmAccountCPF, (req, res) => {
  const { amount } = req.body
  const { customer } = req

  const balance = getBalance(customer.statement)
  if (balance < amount) {
    return res.status(400).send('Insufficient funds')
  }

  const statementOperation = {
    amount,
    createdAt: new Date(),
    type: 'debit'
  }

  customer.statement.push(statementOperation)
  return res.status(201).send(customer.statement)
})

app.listen(3333, () => {
  console.log('Servidor iniciado')
})
