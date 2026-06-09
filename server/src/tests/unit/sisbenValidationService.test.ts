import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';

import {
  extractSisbenText,
  validateSisbenAgainstCedula,
  validateSisbenFile
} from '../../services/sisbenValidationService';

jest.mock('fs/promises', () => ({
  readFile: jest.fn()
}));

jest.mock('pdf-parse', () => jest.fn());

jest.mock('tesseract.js', () => ({
  createWorker: jest.fn()
}));

describe('sisbenValidationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractSisbenText', () => {
    it('extrae texto desde PDF', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('fake pdf'));
      (pdfParse as unknown as jest.Mock).mockResolvedValue({ text: 'Documento SISBEN' });

      const text = await extractSisbenText('/tmp/sisben.pdf');

      expect(fs.readFile).toHaveBeenCalledWith('/tmp/sisben.pdf');
      expect(text).toBe('Documento SISBEN');
    });

    it('extrae texto desde imagen usando OCR', async () => {
      const recognize = jest.fn().mockResolvedValue({ data: { text: 'Cedula 123456' } });
      const terminate = jest.fn().mockResolvedValue(undefined);
      (createWorker as jest.Mock).mockResolvedValue({ recognize, terminate });

      const text = await extractSisbenText('/tmp/cedula.png');

      expect(createWorker).toHaveBeenCalledWith('spa+eng');
      expect(recognize).toHaveBeenCalledWith('/tmp/cedula.png');
      expect(terminate).toHaveBeenCalled();
      expect(text).toBe('Cedula 123456');
    });

    it('lanza error para tipo de archivo no soportado', async () => {
      await expect(extractSisbenText('/tmp/sisben.docx')).rejects.toThrow(
        'Tipo de archivo SISBEN no soportado para validación automática'
      );
    });
  });

  describe('validateSisbenFile', () => {
    it('retorna validación exitosa cuando cédula, nombre y apellido coinciden', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('fake pdf'));
      (pdfParse as unknown as jest.Mock).mockResolvedValue({
        text: 'Cedula: 12345678 Nombre: Laura Apellido: Gomez'
      });

      const result = await validateSisbenFile('/tmp/sisben.pdf', {
        cedula: '12345678',
        name: 'Laura',
        lastName: 'Gomez'
      });

      expect(result).toEqual({
        validated: true,
        mismatches: {
          cedula: false,
          name: false,
          lastName: false,
          cedulaDocument: false
        }
      });
    });
  });

  describe('validateSisbenAgainstCedula', () => {
    it('retorna validación exitosa cuando SISBEN y cédula frontal coinciden', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('fake pdf'));
      (pdfParse as unknown as jest.Mock)
        .mockResolvedValueOnce({ text: 'SISBEN de Laura Gomez cedula 12345678' })
        .mockResolvedValueOnce({ text: 'Documento de identidad 12345678' });

      const result = await validateSisbenAgainstCedula('/tmp/sisben.pdf', '/tmp/cedula.pdf', {
        cedula: '12345678',
        name: 'Laura',
        lastName: 'Gomez'
      });

      expect(result.validated).toBe(true);
      expect(result.mismatches).toEqual({
        cedula: false,
        name: false,
        lastName: false,
        cedulaDocument: false
      });
    });

    it('marca mismatch cuando la cédula no aparece en el documento de identidad', async () => {
      (fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('fake pdf'));
      (pdfParse as unknown as jest.Mock)
        .mockResolvedValueOnce({ text: 'SISBEN de Laura Gomez cedula 12345678' })
        .mockResolvedValueOnce({ text: 'Documento sin numero esperado' });

      const result = await validateSisbenAgainstCedula('/tmp/sisben.pdf', '/tmp/cedula.pdf', {
        cedula: '12345678',
        name: 'Laura',
        lastName: 'Gomez'
      });

      expect(result.validated).toBe(false);
      expect(result.mismatches).toEqual({
        cedula: false,
        name: false,
        lastName: false,
        cedulaDocument: true
      });
    });
  });
});
