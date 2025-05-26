/**
 * User model interface
 */
export interface IUser {
  id?: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profileImage?: string;
  userType: 'SELLER' | 'BUYER' | 'ADMIN';
  isActive: boolean;
  createdAt?: Date;
}

/**
 * Certificate type enum
 */
export enum CertificationType {
  INVIMA = 'INVIMA',
  ICA = 'ICA',
  REGISTRO_SANITARIO = 'REGISTRO_SANITARIO',
  CERTIFICADO_ORGANICO = 'CERTIFICADO_ORGANICO'
}

/**
 * Certificate status enum
 */
export enum CertificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

/**
 * User certification interface
 */
export interface IUserCertification {
  id: string;
  userId: string;
  certificationName: string;
  certificationType: CertificationType;
  certificateNumber: string;
  issuedDate: string;
  expiryDate: string;
  imageUrl: string;
  status: CertificationStatus;
  uploadedAt: string;
  verifiedAt?: string;
  verifierAdminId?: string;
  rejectionReason?: string;
  user?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    email: string;
    profileImage?: string;
  };
  verifierAdmin?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

/**
 * Certification service interface
 */
export interface ICertificationService {
  getUserCertifications(userId: string): Promise<IUserCertification[]>;
  uploadCertification(certification: Omit<IUserCertification, 'id' | 'status' | 'uploadedAt'>): Promise<IUserCertification>;
  validateUserCertifications(userId: string): Promise<boolean>;
  approveCertification(certificationId: string, verifierAdminId: string): Promise<IUserCertification>;
  rejectCertification(certificationId: string, verifierAdminId: string, rejectionReason: string): Promise<IUserCertification>;
} 