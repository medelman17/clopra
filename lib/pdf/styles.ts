import { StyleDictionary, TDocumentDefinitions } from 'pdfmake/interfaces';

export const pdfStyles: StyleDictionary = {
  header: {
    fontSize: 18,
    bold: true,
    color: '#1e293b',
    margin: [0, 0, 0, 15] as [number, number, number, number],
  },
  subheader: {
    fontSize: 14,
    bold: true,
    color: '#334155',
    margin: [0, 10, 0, 5] as [number, number, number, number],
  },
  body: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 1.5,
  },
  label: {
    fontSize: 10,
    color: '#64748b',
    bold: true,
  },
  value: {
    fontSize: 11,
    color: '#1e293b',
  },
  categoryHeader: {
    fontSize: 13,
    bold: true,
    color: '#0f172a',
    margin: [0, 15, 0, 8] as [number, number, number, number],
    decoration: 'underline',
  },
  bulletItem: {
    fontSize: 11,
    color: '#334155',
    margin: [20, 2, 0, 2] as [number, number, number, number],
  },
  footer: {
    fontSize: 9,
    color: '#94a3b8',
    italics: true,
  },
  watermark: {
    fontSize: 60,
    color: '#e2e8f0',
    bold: true,
    opacity: 0.1,
  },
};

export const defaultPageMargins: [number, number, number, number] = [60, 80, 60, 80];

export const pageSize: TDocumentDefinitions['pageSize'] = 'LETTER';

export const defaultPageOrientation: TDocumentDefinitions['pageOrientation'] = 'portrait';