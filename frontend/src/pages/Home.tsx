import React from 'react';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/ui/Card';

// Componente de Característica reutilizable
const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => {
  return (
    <Card className="shadow-md bg-white rounded-lg">
      <div className="text-center p-6">
        {/* Ícono con fondo suave */}
        <div className="inline-flex items-center justify-center p-4 mb-4 rounded-full bg-green-0-5 text-green-1">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2 text-blue-3">{title}</h3>
        <p className="text-gray-1">{description}</p>
      </div>
    </Card>
  );
};

// Componente de Producto reutilizable
const ProductCard: React.FC<{
  image: string;
  name: string;
  price: string;
  location: string;
  seller: string;
}> = ({ image, name, price, location, seller }) => {
  return (
    <Card className="shadow-md overflow-hidden rounded-lg bg-white">
      {/* Imagen con ícono de favorito */}
      <div className="relative">
        <img
          src={image}
          alt={name}
          className="w-full h-48 object-cover"
        />
        <button
          className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors"
          aria-label="Agregar a favoritos"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318c2.21-2.21 5.906-2.21 8.116 0
                .198.198.373.407.535.63.162-.223.337-.432.535-.63
                2.21-2.21 5.906-2.21 8.116 0
                2.21 2.21 2.21 5.906 0 8.116l-8.187 8.187
                a2 2 0 01-2.83 0l-8.187-8.187
                c-2.21-2.21-2.21-5.906 0-8.116z"
            />
          </svg>
        </button>
      </div>

      {/* Información del producto */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-blue-3">{name}</h3>
        <p className="text-green-1 font-bold mt-1">{price}</p>
        <div className="flex items-center mt-2 text-sm text-gray-500">
          <svg
            className="h-4 w-4 mr-1 text-green-1"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0
              l-4.244-4.243a8 8 0 1111.314 0z
              M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {location}
        </div>
        <p className="text-sm text-gray-1 mt-2">
          Proveedor: {seller}
        </p>

        {/* Botón para detalles */}
        <div className="mt-4">
          <button className="bg-green-1 hover:bg-green-0-9 text-white py-2 px-4 rounded-md transition-colors">
            Ver Detalles
          </button>
        </div>
      </div>
    </Card>
  );
};

// Componente de Testimonio reutilizable
const TestimonialCard: React.FC<{
  quote: string;
  author: string;
  role: string;
  image: string;
}> = ({ quote, author, role, image }) => {
  return (
    <Card className="shadow-md p-6 h-full bg-white rounded-lg">
      <div className="flex flex-col h-full">
        <div className="mb-4 flex-grow">
          <svg
            className="h-8 w-8 text-green-1 mb-2"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <p className="text-gray-1">{quote}</p>
        </div>
        <div className="flex items-center mt-4">
          <img
            src={image}
            alt={author}
            className="h-12 w-12 rounded-full mr-4 object-cover"
          />
          <div>
            <p className="font-semibold text-blue-3">{author}</p>
            <p className="text-sm text-gray-500">{role}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

const Home: React.FC = () => {
  // Datos para las características
  const features = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5
               a2 2 0 00-2 2v6a2 2 0 002 2h2
               a2 2 0 002-2zm0 0V9a2 2 0 012-2h2
               a2 2 0 012 2v10m-6 0a2 2 0 002 2h2
               a2 2 0 002-2m0 0V5a2 2 0 012-2h2
               a2 2 0 012 2v14a2 2 0 01-2 2h-2
               a2 2 0 01-2-2z"
          />
        </svg>
      ),
      title: "Transparencia de Precios",
      description:
        "Consulta tarifas actualizadas cada 20 minutos y ve tendencias históricas."
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5
               S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18
               s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5
               c1.747 0 3.332.477 4.5 1.253v13
               C19.832 18.477 18.247 18 16.5 18
               c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
      title: "Soporte y Capacitación",
      description:
        "Accede a tips agrícolas, alertas climáticas y asesoría financiera básica."
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857
               M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857
               M7 20H2v-2a3 3 0 015.356-1.857
               M7 20v-2c0-.656.126-1.283.356-1.857
               m0 0a5.002 5.002 0 019.288 0
               M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3
               a2 2 0 11-4 0 2 2 0 014 0zM7 10
               a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      title: "Conexión Directa",
      description:
        "Negocia sin intermediarios. Más ingresos para productores y ahorro para compradores."
    }
  ];

  // Datos para los productos (tres tarjetas con café)
  const products = [
    {
      image: "https://placehold.co/600x400/046B4D/FFFFFF?text=Café+Colombiano",
      name: "Café Colombiano",
      price: "$12.000 COP/kg",
      location: "Antioquia",
      seller: "Marina Gómez"
    },
    {
      image: "https://placehold.co/600x400/046B4D/FFFFFF?text=Café+Colombiano",
      name: "Café Colombiano",
      price: "$12.000 COP/kg",
      location: "Antioquia",
      seller: "Marina Gómez"
    },
    {
      image: "https://placehold.co/600x400/046B4D/FFFFFF?text=Café+Colombiano",
      name: "Café Colombiano",
      price: "$12.000 COP/kg",
      location: "Antioquia",
      seller: "Marina Gómez"
    }
  ];

  // Datos para los testimonios (dos tarjetas)
  const testimonials = [
    {
      quote:
        "Gracias a Agricoventas, vendí mi cosecha de café un 20% más rápido. Lo que antes me tardaba dos semanas, ahora lo cierro en 3 días.",
      author: "Carlos Rodríguez",
      role: "Agricultor de Café",
      image: "https://placehold.co/200x200/046B4D/FFFFFF?text=CR"
    },
    {
      quote:
        "Logré contactar productores de frutas frescas en cuestión de minutos. La transparencia de precios me da mucha tranquilidad.",
      author: "Ana Martínez",
      role: "Compradora Mayorista",
      image: "https://placehold.co/200x200/046B4D/FFFFFF?text=AM"
    }
  ];

  return (
    <MainLayout title="Agricoventas">
      {/* Hero Section */}
      <div className="w-full bg-green-0-5/30">
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col md:flex-row items-center">
            {/* Texto principal */}
            <div className="md:w-1/2 md:pr-8 mb-8 md:mb-0">
              <h1 className="text-3xl md:text-4xl font-bold text-blue-3 mb-4 leading-tight">
                Conectando el Campo Colombiano con el Futuro Digital
              </h1>
              <p className="text-gray-700 mb-8 max-w-lg">
                Unimos agricultores y compradores directamente, eliminando 
                intermediarios y garantizando precios justos para todos.
              </p>
              <div className="flex gap-4">
                <a
                  href="/register"
                  className="bg-green-1 hover:bg-green-0-9 text-white font-medium py-3 px-6 rounded transition-colors"
                >
                  ¡Empieza a Vender!
                </a>
                <a
                  href="/mercado-general"
                  className="border border-green-1 text-green-1 hover:bg-green-0-5/30 font-medium py-3 px-6 rounded transition-colors"
                >
                  Explora el Mercado
                </a>
              </div>
            </div>

            {/* Imagen */}
            <div className="md:w-1/2">
              <img
                src="https://placehold.co/800x600/046B4D/FFFFFF?text=Agricultor+Digital"
                alt="Agricultor usando tecnología"
                className="rounded-lg w-full h-auto shadow-md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Product Showcase */}
      <div className="w-full py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Productos Destacados
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <ProductCard
                key={index}
                image={product.image}
                name={product.name}
                price={product.price}
                location={product.location}
                seller={product.seller}
              />
            ))}
          </div>
          <div className="text-center mt-12">
            <a
              href="/mercado-general"
              className="inline-flex items-center text-green-1 hover:text-green-0-9 font-medium"
            >
              Ver todos los productos
              <svg
                className="ml-2 w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="w-full py-16 bg-green-0-1/20">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Lo Que Dicen Nuestros Usuarios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard
                key={index}
                quote={testimonial.quote}
                author={testimonial.author}
                role={testimonial.role}
                image={testimonial.image}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="w-full py-16 bg-green-1 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            ¿Listo para vender tus productos sin intermediarios?
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Únete a la revolución digital del campo colombiano.
          </p>
          <a
            href="/register"
            className="inline-block bg-yellow-1 text-blue-3 font-bold py-3 px-8 rounded-lg hover:bg-yellow-1-5 transition-colors"
          >
            ¡Regístrate y Comienza Hoy!
          </a>
        </div>
      </div>
    </MainLayout>
  );
};

export default Home;
