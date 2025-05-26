import React from 'react';
import { Link } from 'react-router-dom';
import Modal from '../../components/ui/Modal';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, onAccept }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Términos y Condiciones"
      size="lg"
      footer={
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cerrar
          </button>
          {onAccept && (
            <button
              onClick={onAccept}
              className="px-4 py-2 bg-green-1 text-white rounded-md hover:bg-green-0-9 transition-colors"
            >
              Aceptar
            </button>
          )}
        </div>
      }
    >
      <div className="prose max-w-none p-4 max-h-[70vh] overflow-y-auto">
        <p className="text-gray-600 mb-4">
          Última actualización: 25 de Mayo de 2025
        </p>

        <h2 className="text-xl font-semibold mt-4 mb-2 text-gray-800">1. Introducción</h2>
        <p className="mb-4">
          Bienvenido a Agricoventas, una plataforma que conecta a agricultores y compradores de productos agrícolas en Colombia. 
          Estos Términos y Condiciones rigen su uso de nuestra plataforma y los servicios que ofrecemos.
        </p>
        <p className="mb-4">
          Al utilizar nuestra plataforma, usted acepta cumplir con estos términos. Si no está de acuerdo con alguna parte de estos términos, 
          no podrá acceder al servicio.
        </p>

        <h2 className="text-xl font-semibold mt-4 mb-2 text-gray-800">2. Definiciones</h2>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li><strong>"Plataforma"</strong> se refiere al sitio web y aplicación móvil de Agricoventas.</li>
          <li><strong>"Usuario"</strong> se refiere a cualquier persona que acceda o utilice la Plataforma.</li>
          <li><strong>"Vendedor"</strong> se refiere a los agricultores y productores que ofrecen productos a través de la Plataforma.</li>
          <li><strong>"Comprador"</strong> se refiere a los usuarios que compran productos a través de la Plataforma.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-4 mb-2 text-gray-800">3. Registro y Cuentas</h2>
        <p className="mb-4">
          Para utilizar ciertas funciones de nuestra Plataforma, es posible que deba registrarse y crear una cuenta. Usted acepta proporcionar 
          información precisa, actualizada y completa durante el proceso de registro y mantener esta información actualizada.
        </p>

        <h2 className="text-xl font-semibold mt-4 mb-2 text-gray-800">4. Certificaciones</h2>
        <p className="mb-4">
          Los Vendedores deben obtener y mantener todas las certificaciones requeridas por la ley colombiana para vender productos agrícolas, 
          incluyendo pero no limitado a certificaciones del INVIMA, ICA, Registros Sanitarios y Certificados Orgánicos cuando corresponda.
        </p>

        <h2 className="text-xl font-semibold mt-4 mb-2 text-gray-800">5. Compras y Ventas</h2>
        <p className="mb-4">
          La Plataforma facilita las transacciones entre Compradores y Vendedores, pero no es parte de ningún contrato de compraventa 
          entre ellos. Agricoventas no garantiza la calidad, seguridad o legalidad de los productos ofrecidos.
        </p>

        <h2 className="text-xl font-semibold mt-4 mb-2 text-gray-800">6. Pagos y Comisiones</h2>
        <p className="mb-4">
          Agricoventas cobrará una comisión sobre cada transacción completada a través de la Plataforma. Las comisiones se detallan 
          en nuestra sección de Precios y pueden estar sujetas a cambios.
        </p>

        <h2 className="text-xl font-semibold mt-4 mb-2 text-gray-800">7. Propiedad Intelectual</h2>
        <p className="mb-4">
          Todo el Contenido disponible a través de la Plataforma que no sea proporcionado por los usuarios es propiedad de Agricoventas 
          o de sus licenciantes y está protegido por leyes de propiedad intelectual.
        </p>

        <p className="mt-6 text-gray-700">
          Para ver los términos completos, visite nuestra <Link to="/terminos-y-condiciones" className="text-green-1 hover:underline">página de Términos y Condiciones</Link>.
        </p>
      </div>
    </Modal>
  );
};

export default TermsModal; 