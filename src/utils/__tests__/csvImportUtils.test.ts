import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isValidEmail, parseAndValidateCsv, parseCsvRows } from '../csvImportUtils'

test('isValidEmail validates standard email addresses', () => {
  assert.equal(isValidEmail('aarav.sharma@capacityconnect.in'), true)
  assert.equal(isValidEmail('admin@kuma.gov.in'), true)
  assert.equal(isValidEmail('invalid-email'), false)
  assert.equal(isValidEmail('user@domain'), false)
  assert.equal(isValidEmail(''), false)
})

test('parseCsvRows splits quoted and unquoted CSV cells accurately', () => {
  const csv = `fullName,emailAddress,department,designation\n"Rao, Ananya",ananya@acme.com,"Data & Analytics",Data Analyst`
  const rows = parseCsvRows(csv)
  assert.equal(rows.length, 2)
  assert.deepEqual(rows[1], ['Rao, Ananya', 'ananya@acme.com', 'Data & Analytics', 'Data Analyst'])
})

test('parseAndValidateCsv parses headers and validates valid rows', () => {
  const csv = `fullName,emailAddress,department,designation,employeeId
Ananya Rao,ananya@acme.com,Engineering,Software Developer,EMP101
Rohit Menon,rohit@acme.com,Data & Analytics,Data Analyst,EMP102`

  const res = parseAndValidateCsv(csv, ['Engineering', 'Data & Analytics'], ['Software Developer', 'Data Analyst'])
  assert.equal(res.totalRows, 2)
  assert.equal(res.validCount, 2)
  assert.equal(res.errorCount, 0)
  assert.equal(res.validRows.length, 2)
  assert.equal(res.validRows[0].name, 'Ananya Rao')
  assert.equal(res.validRows[0].email, 'ananya@acme.com')
})

test('parseAndValidateCsv detects missing fields, invalid email format, and duplicate emails', () => {
  const csv = `fullName,emailAddress,department,designation
Ananya Rao,ananya@acme.com,Engineering,Software Developer
,bad-email-format,Engineering,Software Developer
Rohit Menon,ananya@acme.com,Data & Analytics,Data Analyst`

  const res = parseAndValidateCsv(csv)
  assert.equal(res.totalRows, 3)
  assert.equal(res.validCount, 1)
  assert.equal(res.errorCount, 2)

  // Row 2: Missing name & invalid email format
  assert.equal(res.rows[1].isValid, false)
  assert.equal(res.rows[1].errors.length >= 2, true)

  // Row 3: Duplicate email in CSV
  assert.equal(res.rows[2].isValid, false)
  assert.equal(res.rows[2].errors.some(e => e.includes('Duplicate email')), true)
})

test('parseAndValidateCsv issues warnings for unknown department or designation', () => {
  const csv = `fullName,emailAddress,department,designation
Sneha Kulkarni,sneha@acme.com,Quantum Engineering,AI Specialist`

  const res = parseAndValidateCsv(csv, ['Engineering'], ['Software Developer'])
  assert.equal(res.validCount, 1)
  assert.equal(res.rows[0].warnings.length, 2)
  assert.equal(res.rows[0].warnings[0].includes('Department "Quantum Engineering"'), true)
})
