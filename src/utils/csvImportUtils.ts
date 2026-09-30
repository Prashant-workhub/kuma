/**
 * Project Kuma - Admin Bulk User Import CSV Parser & Validation Helper
 */

export interface CsvUserRow {
  name: string
  email: string
  department: string
  designation: string
  employeeId: string
}

export interface CsvRowValidation {
  rowNumber: number
  name: string
  email: string
  department: string
  designation: string
  employeeId: string
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface CsvParseResult {
  totalRows: number
  validCount: number
  warningCount: number
  errorCount: number
  rows: CsvRowValidation[]
  validRows: CsvUserRow[]
}

export const MAX_BULK_IMPORT_ROWS = 500

/**
 * Validates basic RFC 5322 email syntax.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const clean = email.trim()
  if (clean.length > 254) return false
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(clean)
}

/**
 * Parses raw CSV string into headers and data rows, taking into account quotes and commas.
 */
export function parseCsvRows(csvContent: string): string[][] {
  if (!csvContent || !csvContent.trim()) return []

  const lines = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const rows: string[][] = []

  for (const line of lines) {
    if (!line.trim()) continue

    const cells: string[] = []
    let currentCell = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          currentCell += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        cells.push(currentCell.trim())
        currentCell = ''
      } else {
        currentCell += char
      }
    }
    cells.push(currentCell.trim())
    rows.push(cells)
  }

  return rows
}

/**
 * Maps header names to field keys.
 */
function normalizeHeaderName(header: string): keyof CsvUserRow | null {
  const clean = header.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (clean.includes('name') || clean.includes('fullname')) return 'name'
  if (clean.includes('email') || clean.includes('mail')) return 'email'
  if (clean.includes('dept') || clean.includes('department')) return 'department'
  if (clean.includes('desig') || clean.includes('designation') || clean.includes('role') || clean.includes('title')) return 'designation'
  if (clean.includes('empid') || clean.includes('employeeid') || clean.includes('id')) return 'employeeId'
  return null
}

/**
 * Parses CSV content and performs row-level validation (empty fields, email format, duplicates, unknown metadata).
 */
export function parseAndValidateCsv(
  csvContent: string,
  knownDepartments: string[] = [],
  knownDesignations: string[] = []
): CsvParseResult {
  const parsedRows = parseCsvRows(csvContent)

  if (parsedRows.length === 0) {
    return {
      totalRows: 0,
      validCount: 0,
      warningCount: 0,
      errorCount: 0,
      rows: [],
      validRows: []
    }
  }

  // Determine header index or column order
  const firstRow = parsedRows[0]
  const headerMap: Record<number, keyof CsvUserRow> = {}
  let hasHeaderRow = false

  firstRow.forEach((cell, idx) => {
    const fieldKey = normalizeHeaderName(cell)
    if (fieldKey) {
      headerMap[idx] = fieldKey
      hasHeaderRow = true
    }
  })

  // Fallback positional mapping if header row is not detected
  if (!hasHeaderRow) {
    headerMap[0] = 'name'
    headerMap[1] = 'email'
    headerMap[2] = 'department'
    headerMap[3] = 'designation'
    headerMap[4] = 'employeeId'
  }

  const dataRows = hasHeaderRow ? parsedRows.slice(1) : parsedRows

  const seenEmails = new Set<string>()
  const validatedRows: CsvRowValidation[] = []
  const validRowsList: CsvUserRow[] = []

  let validCount = 0
  let warningCount = 0
  let errorCount = 0

  dataRows.forEach((row, idx) => {
    const rowNum = hasHeaderRow ? idx + 2 : idx + 1
    let name = ''
    let email = ''
    let department = 'General'
    let designation = 'Trainee'
    let employeeId = ''

    if (hasHeaderRow) {
      row.forEach((cell, cellIdx) => {
        const fieldKey = headerMap[cellIdx]
        if (fieldKey === 'name') name = cell
        else if (fieldKey === 'email') email = cell
        else if (fieldKey === 'department' && cell) department = cell
        else if (fieldKey === 'designation' && cell) designation = cell
        else if (fieldKey === 'employeeId' && cell) employeeId = cell
      })
    } else {
      name = row[0] || ''
      email = row[1] || ''
      department = row[2] || 'General'
      designation = row[3] || 'Trainee'
      employeeId = row[4] || ''
    }

    const errors: string[] = []
    const warnings: string[] = []

    const cleanEmail = email.trim().toLowerCase()
    const cleanName = name.trim()

    if (!cleanName) {
      errors.push('Full name is required')
    }

    if (!cleanEmail) {
      errors.push('Email address is required')
    } else if (!isValidEmail(cleanEmail)) {
      errors.push(`Invalid email format: "${email}"`)
    } else if (seenEmails.has(cleanEmail)) {
      errors.push(`Duplicate email in CSV: "${cleanEmail}"`)
    } else {
      seenEmails.add(cleanEmail)
    }

    if (knownDepartments.length > 0 && department && !knownDepartments.some(d => d.toLowerCase() === department.toLowerCase())) {
      warnings.push(`Department "${department}" is not yet in the organization registry (will be auto-created).`)
    }

    if (knownDesignations.length > 0 && designation && !knownDesignations.some(d => d.toLowerCase() === designation.toLowerCase())) {
      warnings.push(`Designation "${designation}" is not yet in the organization registry (will be auto-created).`)
    }

    const isValid = errors.length === 0

    if (isValid) {
      validCount++
      if (warnings.length > 0) warningCount++
      validRowsList.push({
        name: cleanName,
        email: cleanEmail,
        department: department.trim() || 'General',
        designation: designation.trim() || 'Trainee',
        employeeId: employeeId.trim()
      })
    } else {
      errorCount++
    }

    validatedRows.push({
      rowNumber: rowNum,
      name: cleanName,
      email: cleanEmail,
      department: department.trim() || 'General',
      designation: designation.trim() || 'Trainee',
      employeeId: employeeId.trim(),
      isValid,
      errors,
      warnings
    })
  })

  return {
    totalRows: dataRows.length,
    validCount,
    warningCount,
    errorCount,
    rows: validatedRows,
    validRows: validRowsList
  }
}
