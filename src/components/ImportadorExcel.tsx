'use client';

import { importarInsumosMasivo } from '@/actions/admin';
import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

interface Props {
  sedeId: string;
}

export default function ImportadorExcel({ sedeId }: Props) {
  const [isPending, setIsPending] = useState(false);
  const [resultado, setResultado] = useState<{ success: boolean; message: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setResultado(null);

    const formData = new FormData(e.currentTarget);
    const file = formData.get('archivo') as File;

    if (!file) {
      setResultado({ success: false, message: 'Por favor selecciona un archivo' });
      setIsPending(false);
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

      if (jsonData.length < 2) {
        throw new Error('El archivo está vacío o no tiene filas de datos');
      }

      const dataRows = jsonData.slice(1);

      const insumos = dataRows
        .filter((row) => row[0] && row[1])
        .map((row) => ({
          nombre: String(row[0] || '').trim(),
          unidadMedida: String(row[1] || '').trim().toLowerCase(),
          costoUnitario: parseFloat(String(row[2] || '0')) || 0,
          stockInicial: parseFloat(String(row[3] || '0')) || 0,
        }));

      if (insumos.length === 0) {
        throw new Error('No se encontraron registros válidos para importar');
      }

      await importarInsumosMasivo(insumos, sedeId);
      setResultado({ success: true, message: `✅ Se importaron ${insumos.length} insumos exitosamente` });
      formRef.current?.reset();
    } catch (error) {
      setResultado({ success: false, message: `❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}` });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-bold text-slate-900 mb-2">Importar Insumos desde Excel</h3>
      <p className="text-sm text-slate-500 mb-4">
        Formato esperado: Columnas - Nombre | Unidad de Medida | Costo Unitario | Stock Inicial
      </p>
      <div>
        <input
          name="archivo"
          type="file"
          accept=".xlsx,.xls,.csv"
          required
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
      >
        {isPending ? 'Importando...' : 'Subir e Importar'}
      </button>
      {resultado && (
        <p className={`text-sm font-medium ${resultado.success ? 'text-emerald-600' : 'text-red-600'}`}>
          {resultado.message}
        </p>
      )}
    </form>
  );
}