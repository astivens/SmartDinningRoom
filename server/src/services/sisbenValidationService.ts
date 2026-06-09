import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';

export interface SisbenValidationPayload {
  cedula: string;
  name: string;
  lastName: string;
}

export interface SisbenValidationResult {
  validated: boolean;
  mismatches: {
    cedula: boolean;
    name: boolean;
    lastName: boolean;
    cedulaDocument: boolean;
  };
}

const normalizeText = (value: string): string => (
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
);

const extractFromPdf = async (filePath: string): Promise<string> => {
  const buffer = await fs.readFile(filePath);
  const result = await pdfParse(buffer);
  return result.text ?? '';
};

const extractFromImage = async (filePath: string): Promise<string> => {
  const worker = await createWorker('spa+eng');
  try {
    const { data } = await worker.recognize(filePath);
    return data.text ?? '';
  } finally {
    await worker.terminate();
  }
};

export const extractSisbenText = async (filePath: string): Promise<string> => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') {
    return extractFromPdf(filePath);
  }
  if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
    return extractFromImage(filePath);
  }
  throw new Error('Tipo de archivo SISBEN no soportado para validación automática');
};

export const validateSisbenFile = async (
  filePath: string,
  payload: SisbenValidationPayload
): Promise<SisbenValidationResult> => {
  const rawText = await extractSisbenText(filePath);
  const text = normalizeText(rawText);

  const cedula = normalizeText(payload.cedula).replace(/\D/g, '');
  const name = normalizeText(payload.name);
  const lastName = normalizeText(payload.lastName);

  const cedulaMatch = cedula.length > 0 && text.includes(cedula);
  const nameMatch = name.length > 0 && text.includes(name);
  const lastNameMatch = lastName.length > 0 && text.includes(lastName);

  return {
    validated: cedulaMatch && nameMatch && lastNameMatch,
    mismatches: {
      cedula: !cedulaMatch,
      name: !nameMatch,
      lastName: !lastNameMatch,
      cedulaDocument: false
    }
  };
};

export const validateSisbenAgainstCedula = async (
  sisbenPath: string,
  cedulaPath: string,
  payload: SisbenValidationPayload
): Promise<SisbenValidationResult> => {
  const [sisbenRawText, cedulaRawText] = await Promise.all([
    extractSisbenText(sisbenPath),
    extractSisbenText(cedulaPath)
  ]);

  const sisbenText = normalizeText(sisbenRawText);
  const cedulaText = normalizeText(cedulaRawText);

  const cedula = normalizeText(payload.cedula).replace(/\D/g, '');
  const name = normalizeText(payload.name);
  const lastName = normalizeText(payload.lastName);

  const cedulaInSisben = cedula.length > 0 && sisbenText.includes(cedula);
  const cedulaInDocument = cedula.length > 0 && cedulaText.includes(cedula);
  const nameMatch = name.length > 0 && sisbenText.includes(name);
  const lastNameMatch = lastName.length > 0 && sisbenText.includes(lastName);

  return {
    validated: cedulaInSisben && cedulaInDocument && nameMatch && lastNameMatch,
    mismatches: {
      cedula: !cedulaInSisben,
      name: !nameMatch,
      lastName: !lastNameMatch,
      cedulaDocument: !cedulaInDocument
    }
  };
};
