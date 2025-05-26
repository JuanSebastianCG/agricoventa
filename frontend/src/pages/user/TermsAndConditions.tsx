import React from 'react';
import MainLayout from '../../components/layout/MainLayout';
import Header from '../../components/layout/Header';
import { Link } from 'react-router-dom';

const TermsAndConditions: React.FC = () => {
  return (
    <>
      <Header />
      <MainLayout title="Términos y Condiciones">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h1 className="text-3xl font-bold text-green-1 mb-6">Términos y Condiciones</h1>
            <p className="text-gray-600 mb-4">
              Última actualización: 25 de Mayo de 2025
            </p>

            <div className="prose max-w-none">
              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">1. Introducción</h2>
              <p className="mb-4">
                Bienvenido a Agricoventas, una plataforma que conecta a agricultores y compradores de productos agrícolas en Colombia. 
                Estos Términos y Condiciones rigen su uso de nuestra plataforma y los servicios que ofrecemos.
              </p>
              <p className="mb-4">
                Al utilizar nuestra plataforma, usted acepta cumplir con estos términos. Si no está de acuerdo con alguna parte de estos términos, 
                no podrá acceder al servicio.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">2. Definiciones</h2>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li><strong>"Plataforma"</strong> se refiere al sitio web y aplicación móvil de Agricoventas.</li>
                <li><strong>"Usuario"</strong> se refiere a cualquier persona que acceda o utilice la Plataforma.</li>
                <li><strong>"Vendedor"</strong> se refiere a los agricultores y productores que ofrecen productos a través de la Plataforma.</li>
                <li><strong>"Comprador"</strong> se refiere a los usuarios que compran productos a través de la Plataforma.</li>
                <li><strong>"Contenido"</strong> se refiere a la información mostrada en la Plataforma, incluidos textos, imágenes, videos, etc.</li>
              </ul>

              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">3. Registro y Cuentas</h2>
              <p className="mb-4">
                Para utilizar ciertas funciones de nuestra Plataforma, es posible que deba registrarse y crear una cuenta. Usted acepta proporcionar 
                información precisa, actualizada y completa durante el proceso de registro y mantener esta información actualizada.
              </p>
              <p className="mb-4">
                Usted es responsable de mantener la confidencialidad de su cuenta y contraseña, y acepta no compartir su contraseña o dar 
                acceso a su cuenta a ninguna otra persona. Usted es responsable de todas las actividades que ocurran bajo su cuenta.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">4. Certificaciones</h2>
              <p className="mb-4">
                Los Vendedores deben obtener y mantener todas las certificaciones requeridas por la ley colombiana para vender productos agrícolas, 
                incluyendo pero no limitado a certificaciones del INVIMA, ICA, Registros Sanitarios y Certificados Orgánicos cuando corresponda.
              </p>
              <p className="mb-4">
                Agricoventas se reserva el derecho de verificar estas certificaciones y denegar el acceso a la Plataforma a los Vendedores 
                que no cumplan con estos requisitos.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">5. Compras y Ventas</h2>
              <p className="mb-4">
                La Plataforma facilita las transacciones entre Compradores y Vendedores, pero no es parte de ningún contrato de compraventa 
                entre ellos. Agricoventas no garantiza la calidad, seguridad o legalidad de los productos ofrecidos.
              </p>
              <p className="mb-4">
                Los Vendedores son responsables de establecer los precios de sus productos, proporcionar descripciones precisas y cumplir 
                con todas las leyes aplicables, incluidas las relacionadas con la seguridad alimentaria y el etiquetado.
              </p>
              <p className="mb-4">
                Los Compradores son responsables de verificar la información del producto antes de realizar una compra y de seguir las 
                instrucciones de manipulación y almacenamiento proporcionadas por los Vendedores.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">6. Pagos y Comisiones</h2>
              <p className="mb-4">
                Agricoventas cobrará una comisión sobre cada transacción completada a través de la Plataforma. Las comisiones se detallan 
                en nuestra sección de Precios y pueden estar sujetas a cambios.
              </p>
              <p className="mb-4">
                Los pagos se procesarán a través de proveedores de servicios de pago de terceros. Agricoventas no almacena información de 
                tarjetas de crédito u otros detalles de pago sensibles.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">7. Propiedad Intelectual</h2>
              <p className="mb-4">
                Todo el Contenido disponible a través de la Plataforma que no sea proporcionado por los usuarios es propiedad de Agricoventas 
                o de sus licenciantes y está protegido por leyes de propiedad intelectual.
              </p>
              <p className="mb-4">
                Al publicar Contenido en la Plataforma, los usuarios otorgan a Agricoventas una licencia no exclusiva, mundial, libre de regalías 
                para usar, reproducir, modificar, adaptar, publicar, traducir y distribuir dicho Contenido en cualquier medio.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">8. Privacidad</h2>
              <p className="mb-4">
                Nuestro uso de su información personal se rige por nuestra Política de Privacidad. Al utilizar la Plataforma, usted acepta 
                nuestras prácticas de recopilación y uso de datos como se describe en dicha política.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">9. Terminación</h2>
              <p className="mb-4">
                Agricoventas puede terminar o suspender su cuenta y acceso a la Plataforma inmediatamente, sin previo aviso ni responsabilidad, 
                por cualquier motivo, incluido, entre otros, el incumplimiento de estos Términos.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">10. Limitación de Responsabilidad</h2>
              <p className="mb-4">
                En ningún caso Agricoventas, sus directores, empleados, socios, agentes, proveedores o afiliados serán responsables por cualquier 
                daño indirecto, incidental, especial, consecuente o punitivo, incluida la pérdida de ganancias, datos, uso, buena voluntad u otras 
                pérdidas intangibles, que resulten de su acceso o uso de la Plataforma.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">11. Cambios a los Términos</h2>
              <p className="mb-4">
                Nos reservamos el derecho, a nuestro exclusivo criterio, de modificar o reemplazar estos Términos en cualquier momento. Si una 
                revisión es material, intentaremos proporcionar al menos 30 días de aviso antes de que entren en vigor los nuevos términos.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">12. Ley Aplicable</h2>
              <p className="mb-4">
                Estos Términos se regirán e interpretarán de acuerdo con las leyes de Colombia, sin tener en cuenta sus disposiciones sobre 
                conflictos de leyes.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800">13. Contacto</h2>
              <p className="mb-4">
                Si tiene alguna pregunta sobre estos Términos, por favor contáctenos a través de nuestro formulario de contacto o envíenos un 
                correo electrónico a info@agricoventas.com.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link 
                to="/register" 
                className="inline-block px-6 py-3 bg-green-1 text-white font-medium rounded-md hover:bg-green-0-9 transition-colors"
              >
                Volver al Registro
              </Link>
              <Link 
                to="/" 
                className="inline-block px-6 py-3 ml-4 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300 transition-colors"
              >
                Ir al Inicio
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
};

export default TermsAndConditions; 