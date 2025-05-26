import React from 'react';
import { Link } from 'react-router-dom';

interface User {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  userType?: string;
  phoneNumber?: string | null;
  profileImage?: string | null;
}

interface UserProfileProps {
  user: User | null;
  variant?: 'basic' | 'detailed' | 'card';
  showActions?: boolean;
  className?: string;
}

const getUserInitials = (user: User | null) => {
  if (!user) return '?';
  
  // Use firstName and lastName if available
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  
  // Fallback to username
  return user.username ? user.username[0].toUpperCase() : '?';
};

// Default avatar image to use when profile image is missing
const defaultAvatar = '/assets/default-avatar.png';

// Helper function to get full image URL
const getImageUrl = (imagePath: string | null) => {
  if (!imagePath) return defaultAvatar;
  
  // If the path is already a full URL (starts with http:// or https://), use it as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Otherwise, prepend the API URL
  const apiUrl = import.meta.env.VITE_BACKEND_URL;
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  const fullUrl = `${apiUrl}/${cleanPath}`;
  return fullUrl;
};

const getUserTypeLabel = (userType: string | undefined): string => {
  if (!userType) return 'Usuario';
  
  switch (userType) {
    case 'ADMIN':
      return 'Administrador';
    case 'SELLER':
      return 'Vendedor';
    case 'BUYER':
    default:
      // Cualquier otro tipo se muestra como 'Comprador'
      return 'Comprador';
  }
};

const UserProfile: React.FC<UserProfileProps> = ({ 
  user, 
  variant = 'basic',
  showActions = true,
  className = ''
}) => {
  if (!user) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-gray-500">?</span>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-700">Usuario no disponible</p>
        </div>
      </div>
    );
  }

  // Determine if the variant is 'card'
  const isCard = variant === 'card';
  // Use appropriate size for the profile image based on variant
  const imageSize = isCard ? 'h-24 w-24' : 'h-10 w-10';
  
  return (
    <div className={`${isCard ? 'p-4 border border-gray-0-5 rounded-lg' : ''} ${className}`}>
      <div className={`${isCard ? 'flex flex-col items-center' : 'flex items-center'}`}>
        {/* Profile Image */}
        <div className={`${imageSize} rounded-full overflow-hidden bg-gray-200 flex items-center justify-center`}>
          {user.profileImage ? (
            <img
              src={getImageUrl(user.profileImage)}
              alt={`${user.firstName} ${user.lastName}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.parentElement!.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-sm font-semibold">
                    ${getUserInitials(user)}
                  </div>
                `;
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-sm font-semibold">
              {getUserInitials(user)}
            </div>
          )}
        </div>

        {/* User info */}
        <div className={`${isCard ? 'mt-3 text-center' : 'ml-3'}`}>
          <p className="text-sm font-medium text-gray-700">
            {user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user.username}
          </p>
          
          {variant !== 'basic' && (
            <>
              {user.email && <p className="text-sm text-gray-500">{user.email}</p>}
              <p className="text-xs text-gray-500">
                {getUserTypeLabel(user.userType)}
              </p>
              
              {variant === 'detailed' && (
                <>
                  {user.phoneNumber && (
                    <p className="text-sm text-gray-500 mt-1">Tel: {user.phoneNumber}</p>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className={`${isCard ? 'mt-4 flex justify-center' : 'mt-2 flex'}`}>
          <Link 
            to={`/perfil${user.id && user.id !== 'me' ? `/${user.id}` : ''}`} 
            className="text-sm text-green-1 hover:text-green-0-9"
          >
            Ver perfil
          </Link>
          
          {user.userType === 'SELLER' && (
            <Link 
              to={`/vendedor/${user.id}`} 
              className="text-sm text-green-1 hover:text-green-0-9 ml-4"
            >
              Ver productos
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfile; 