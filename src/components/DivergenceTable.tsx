import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  FileQuestion,
  ChevronRight,
  ArrowUpDown,
  UploadCloud,
} from 'lucide-react';
import { ReconciliationRow } from '../types';
import { formatCurrency } from '../utils/constants';

interface DivergenceTableProps {
  rows: ReconciliationRow[];
  onSelectRow: (row: ReconciliationRow) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

type SortField = 'companyName' | 'cnpj' | 'relatorio' | 'darf' | 'diferenca';
type SortOrder = 'asc' | 'desc';

export const DivergenceTable: React.FC<DivergenceTableProps> = ({
  rows,
  onSelectRow,
  activeFilter,
  onFilterChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('diferenca');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !term ||
        r.companyName.toLowerCase().includes(term) ||
        r.cnpj.includes(term) ||
        r.rawCnpj.includes(term);

      if (!matchSearch) return false;

      if (activeFilter === 'todos') return true;
      if (activeFilter === 'divergentes') return r.status === 'divergente';
      if (activeFilter === 'conferidos') return r.status === 'conferido';
      if (activeFilter === 'retencoes') return r.hasRetention;
      if (activeFilter === 'terceirizados') return r.status === 'terceirizado_sem_folha';
      if (activeFilter === 'pendentes') return r.status === 'sem_darf';
      if (activeFilter === 'periodo') return r.status === 'periodo_divergente' || r.periodoMismatch;

      return true;
    });
  }, [rows, searchTerm, activeFilter]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'companyName') {
        comparison = a.companyName.localeCompare(b.companyName);
      } else if (sortField === 'cnpj') {
        comparison = a.rawCnpj.localeCompare(b.rawCnpj);
      } else if (sortField === 'relatorio') {
        comparison = a.totalReferenciaRelatorio - b.totalReferenciaRelatorio;
      } else if (sortField === 'darf') {
        comparison = a.totalDarfAjustado - b.totalDarfAjustado;
      } else if (sortField === 'diferenca') {
        comparison = Math.abs(a.diferenca) - Math.abs(b.diferenca);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [filteredRows, sortField, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getStatusBadge = (row: ReconciliationRow) => {
    switch (row.status) {
      case 'conferido':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Conferido</span>
          </span>
        );
      case 'divergente':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            <span>Divergente</span>
          </span>
        );
      case 'terceirizado_sem_folha':
      case 'sem_relatorio':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700" title="Condomínio com contratação terceirizada sem folha de pagamento">
            <span>Terceirizado (Sem Folha)</span>
          </span>
        );
      case 'periodo_divergente':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-800">
            <span>Período Dif.</span>
          </span>
        );
      case 'sem_darf':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
            <span>Sem DARF</span>
          </span>
        );
      default:
        return null;
    }
  };

  // Clean empty state when no files are loaded at all
  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">
          Aguardando arquivos para conferência
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          Faça o upload do arquivo PDF do Resumo de Impostos e das guias DARF nos campos acima para iniciar a conciliação.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Search and filters */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto text-xs pb-1 sm:pb-0">
          {[
            { id: 'todos', label: `Todos (${rows.length})` },
            {
              id: 'divergentes',
              label: `Divergentes (${rows.filter((r) => r.status === 'divergente').length})`,
            },
            {
              id: 'conferidos',
              label: `Conferidos (${rows.filter((r) => r.status === 'conferido').length})`,
            },
            {
              id: 'terceirizados',
              label: `Terceirizados (${rows.filter((r) => r.status === 'terceirizado_sem_folha').length})`,
            },
            {
              id: 'retencoes',
              label: `Com Retenções (${rows.filter((r) => r.hasRetention).length})`,
            },
            {
              id: 'pendentes',
              label: `Pendentes DARF (${rows.filter((r) => r.status === 'sem_darf').length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={`px-3 py-1.5 font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar empresa ou CNPJ..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 select-none">
            <tr>
              <th
                onClick={() => toggleSort('companyName')}
                className="py-3 px-4 cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1.5">
                  <span>Empresa</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => toggleSort('cnpj')}
                className="py-3 px-3 cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center gap-1.5">
                  <span>CNPJ</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="py-3 px-3 text-center">
                <span>Período</span>
              </th>

              <th
                onClick={() => toggleSort('relatorio')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Ref. Relatório</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => toggleSort('darf')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>DARF Ajustado</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="py-3 px-3 text-right">
                <span>Retenções NF</span>
              </th>

              <th
                onClick={() => toggleSort('diferenca')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-900"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Diferença</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="py-3 px-3 text-center">
                <span>Status</span>
              </th>

              <th className="py-3 px-4 text-center">
                <span>Ação</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  Nenhum registro correspondente ao filtro aplicado.
                </td>
              </tr>
            ) : (
              sortedRows.map((row) => {
                const isDivergence = row.status === 'divergente';
                return (
                  <tr
                    key={row.id}
                    onClick={() => onSelectRow(row)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {/* Empresa */}
                    <td className="py-2.5 px-4 font-medium text-slate-900 max-w-xs truncate">
                      {row.companyName}
                    </td>

                    {/* CNPJ */}
                    <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                      {row.cnpj}
                    </td>

                    {/* Período */}
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600 whitespace-nowrap">
                      {row.periodoDarf || row.periodoRelatorio || '-'}
                    </td>

                    {/* Ref Relatório */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900 whitespace-nowrap">
                      {row.report ? formatCurrency(row.totalReferenciaRelatorio) : '-'}
                    </td>

                    {/* DARF Ajustado */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900 whitespace-nowrap">
                      {row.darf ? formatCurrency(row.totalDarfAjustado) : '-'}
                    </td>

                    {/* Retenções */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-amber-700 whitespace-nowrap">
                      {row.totalRetencoesExcluidas > 0
                        ? `-${formatCurrency(row.totalRetencoesExcluidas)}`
                        : '-'}
                    </td>

                    {/* Diferença */}
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold whitespace-nowrap">
                      {row.darf && row.report ? (
                        <span className={isDivergence ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                          {row.diferenca > 0 ? '+' : ''}
                          {formatCurrency(row.diferenca)}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {getStatusBadge(row)}
                    </td>

                    {/* Ação */}
                    <td className="py-2.5 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRow(row);
                        }}
                        className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
