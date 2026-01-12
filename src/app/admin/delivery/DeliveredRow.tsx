
// Add this component after DeliveryRow component
import type { Order } from '@/types/index';
import { brandConfig } from '@/config/brand';
//import brandConfig from '@/config/brandConfig';

function DeliveredRow({
  order,
  onArchive,
}: {
  order: Order;
  onArchive: (orderId: string) => void;
}) {
  const deliveredTime = order.workflow.delivered_at 
    ? order.workflow.delivered_at.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : 'N/A';

  return (
    <tr className="transition-colors bg-green-50">
      {/* Cliente */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0" style={{
            background: brandConfig.gradients.secondary,
          }}>
            {order.customer.display_name?.charAt(0).toUpperCase() || 'C'}
          </div>
          <div>
            <div className="text-gray-900 font-bold text-lg">
              {order.customer.display_name || 'Cliente'}
            </div>
            <div className="text-gray-500 text-sm">
              {order.customer.phone}
            </div>
            <div className="text-gray-400 text-xs font-mono mt-1">
              #{order.order_id.slice(-6).toUpperCase()}
            </div>
          </div>
        </div>
      </td>

      {/* Pedido */}
      <td className="px-6 py-4">
        <div className="space-y-2">
          {order.items.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-white font-bold px-2 py-1 rounded text-xs min-w-[2.5rem] text-center flex-shrink-0" style={{
                backgroundColor: brandConfig.colors.secondary[600],
              }}>
                {item.qty}x
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-gray-900 font-semibold text-sm block">
                  {item.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </td>

      {/* Entregado */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">✅</span>
          <span className="text-2xl font-bold text-green-600">
            {deliveredTime}
          </span>
        </div>
      </td>

      {/* Acción */}
      <td className="px-6 py-4">
        <div className="flex justify-center">
          <button
            onClick={() => onArchive(order.order_id)}
            className="px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105 bg-red-500 text-white hover:bg-red-600"
          >
            🗄️ Archivar
          </button>
        </div>
      </td>
    </tr>
  );
}
