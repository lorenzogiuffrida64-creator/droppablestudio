import React from 'react';
import { CreditCard, Instagram, Loader2 } from 'lucide-react';
import { useStore } from '../services/store';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const Payments: React.FC = () => {
  const { state } = useStore();

  // Get all payments with client info
  const allPayments = state.clients.flatMap(client =>
    client.payments.map(payment => ({
      ...payment,
      clientName: client.instagramHandle || client.company || client.name,
      clientId: client.id,
      packageName: client.packageName
    }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate totals
  const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
  const formatAmount = (amount: number) => {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1).replace('.0', '')}k`;
    }
    return amount.toString();
  };

  // Loading state
  if (state.loading && !state.initialized) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Caricamento pagamenti...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Pagamenti</h2>
          <p className="text-gray-400 mt-1">Cronologia di tutti i pagamenti ricevuti</p>
        </div>
        <div className="bg-primary text-white px-6 py-4 rounded-2xl">
          <p className="text-sm opacity-80">Totale Incassato</p>
          <p className="text-3xl font-bold">€{formatAmount(totalPaid)}</p>
        </div>
      </div>

      {allPayments.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6">
            <h3 className="font-bold text-lg mb-4">Tutti i Pagamenti</h3>
            <div className="space-y-4">
              {allPayments.map(payment => (
                <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-secondary shadow-sm border border-gray-100">
                      <CreditCard size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-lg">€{payment.amount}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Instagram size={12} className="text-gray-400" />
                        <span className="text-sm text-gray-500">{payment.clientName}</span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400">{payment.packageName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      payment.status === 'Pagato' ? 'bg-green-100 text-green-600' :
                      payment.status === 'Parziale' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {payment.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-2">
                      {format(new Date(payment.date), 'dd MMM yyyy', { locale: it })}
                    </p>
                    <p className="text-[10px] text-gray-300">{payment.method} • {payment.invoiceNumber}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-400 mb-2">Nessun pagamento</h3>
          <p className="text-gray-400">I pagamenti appariranno qui quando vengono registrati.</p>
        </div>
      )}
    </div>
  );
};

export default Payments;
