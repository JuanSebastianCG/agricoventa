import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import StyledButton from '../../components/ui/StyledButton';
import StyledTextArea from '../../components/ui/StyledTextArea';
import { useAppContext } from '../../context/AppContext';
import api from '../../services/api';
import { certificationService } from '../../services/certificationService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Modal from '../../components/ui/Modal';

interface Certification {
  id: string;
  userId: string;
  certificationName: string;
  certificationType: string;
  imageUrl: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  uploadedAt: string;
  user: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    email: string;
    profileImage?: string;
  };
  certificateNumber?: string;
  issuedDate?: string;
  expiryDate?: string;
  rejectionReason?: string;
}

const CertificationApproval: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppContext();
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedCertification, setSelectedCertification] = useState<string | null>(null);
  const [paginationData, setPaginationData] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [sortField, setSortField] = useState<string>('uploadedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentFilter, setCurrentFilter] = useState<string>('');
  const [filterUserId, setFilterUserId] = useState<string>('');
  const [filterSearch, setFilterSearch] = useState<string>('');
  
  // Modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingCertification, setViewingCertification] = useState<Certification | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [certificationToReject, setCertificationToReject] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!user || user.userType !== 'ADMIN') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  /**
   * Fetch certifications from the API with pagination
   */
  const fetchCertifications = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const params: Record<string, any> = {
        page: Number(page),
        limit: Number(10), // Increased limit to show more items per page
        sortBy: sortField,
        sortOrder: sortOrder
      };

      // Aplicar filtros adicionales si están definidos
      if (currentFilter) {
        params.status = currentFilter;
      }
      
      if (filterUserId) {
        params.userId = filterUserId;
      }
      
      if (filterSearch) {
        params.search = filterSearch;
      }

      console.log("Fetching certifications with params:", params);
      const serviceResponse = await certificationService.getAllCertificationsAdmin(params);
      console.log("Response from getAllCertificationsAdmin:", serviceResponse);

      if (!serviceResponse) {
        throw new Error('Respuesta vacía del servidor');
      }

      // Check if we have both data and pagination
      if (Array.isArray(serviceResponse.data) && serviceResponse.pagination) {
        // Convert the service response to our local Certification type
        const mappedCertifications: Certification[] = serviceResponse.data.map((cert: any) => ({
          id: cert.id || '',
          userId: cert.userId || '',
          certificationName: cert.certificationName || '',
          certificationType: cert.certificationType || '',
          imageUrl: cert.imageUrl || '',
          status: (cert.status as 'PENDING' | 'VERIFIED' | 'REJECTED') || 'PENDING',
          uploadedAt: typeof cert.uploadedAt === 'string' ? cert.uploadedAt : new Date().toISOString(),
          user: {
            id: cert.user?.id || '',
            username: cert.user?.username || 'Usuario',
            firstName: cert.user?.firstName,
            lastName: cert.user?.lastName,
            email: cert.user?.email || '',
            profileImage: cert.user?.profileImage
          },
          certificateNumber: cert.certificateNumber,
          issuedDate: cert.issuedDate,
          expiryDate: cert.expiryDate,
          rejectionReason: cert.rejectionReason
        }));
        
        setCertifications(mappedCertifications);
        setPaginationData({
          currentPage: serviceResponse.pagination.currentPage || page,
          totalPages: serviceResponse.pagination.totalPages || 1,
          totalItems: serviceResponse.pagination.totalItems || mappedCertifications.length
        });
        return;
      }

      throw new Error('Formato de respuesta no reconocido');
    } catch (err: any) {
      console.error("Error fetching certifications:", err);
      setError(err.message || 'Error al cargar las certificaciones');
      setCertifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch initial data with all certifications
    fetchCertifications(1); 
  }, [sortField, sortOrder]); // Refetch when sort options change

  // Handle sort change
  const handleSortChange = (field: string) => {
    // If clicking the same field, toggle order, otherwise default to ascending
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= paginationData.totalPages) {
      fetchCertifications(newPage);
    }
  };

  // Filter certifications by status
  const handleFilterChange = (status: string) => {
    setCurrentFilter(status);
    // Actualizar las certificaciones con el nuevo filtro
    fetchCertifications(1);
  };

  // Search certifications
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchCertifications(1);
  };

  /**
   * Handle viewing a certification
   */
  const handleViewCertification = async (cert: Certification) => {
    try {
      // For better performance, we'll fetch the full certification data
      // This ensures we have the most up-to-date information including image URLs
      const fullCertificationData = await certificationService.getCertificationById(cert.id);
      
      if (!fullCertificationData) {
        throw new Error('No se pudo obtener los detalles completos de la certificación');
      }
      
      // Map backend data to our local Certification type
      const detailedCert: Certification = {
        id: fullCertificationData.id || cert.id,
        userId: fullCertificationData.userId || cert.userId,
        certificationName: fullCertificationData.certificationName || cert.certificationName,
        certificationType: fullCertificationData.certificationType || cert.certificationType,
        imageUrl: fullCertificationData.imageUrl || cert.imageUrl,
        status: (fullCertificationData.status as 'PENDING' | 'VERIFIED' | 'REJECTED') || cert.status,
        uploadedAt: typeof fullCertificationData.uploadedAt === 'string' 
          ? fullCertificationData.uploadedAt 
          : cert.uploadedAt,
        user: {
          id: fullCertificationData.user?.id || cert.user.id || '',
          username: fullCertificationData.user?.username || cert.user.username || 'Usuario',
          firstName: fullCertificationData.user?.firstName || cert.user.firstName,
          lastName: fullCertificationData.user?.lastName || cert.user.lastName,
          email: fullCertificationData.user?.email || cert.user.email || '',
          profileImage: fullCertificationData.user?.profileImage || cert.user.profileImage
        },
        certificateNumber: fullCertificationData.certificateNumber || cert.certificateNumber,
        issuedDate: fullCertificationData.issuedDate || cert.issuedDate,
        expiryDate: fullCertificationData.expiryDate || cert.expiryDate,
        rejectionReason: fullCertificationData.rejectionReason || cert.rejectionReason
      };
      
      console.log("Viewing certification details:", detailedCert);
      setViewingCertification(detailedCert);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error("Error fetching certification details:", error);
      const errorMessage = error instanceof Error ? error.message : 'Error al cargar datos del certificado';
      setError(errorMessage);
      
      // Si falla la carga detallada, usamos los datos básicos que ya tenemos
      console.log("Falling back to basic certification data");
      setViewingCertification(cert);
      setIsViewModalOpen(true);
    }
  };

  /**
   * Handle certification approval
   */
  const handleApprove = async (certificationId: string) => {
    setIsApproving(true);
    try {
      await certificationService.approveCertification(certificationId, user!.id);
      toast.success("Certificación aprobada exitosamente. El usuario deberá usar 'Verificar certificaciones' en 'Mis Productos' para actualizar su estado.");
      
      // Refresh the certifications list
      fetchCertifications(paginationData.currentPage);
      
      // Close modal after successful approval
      setIsViewModalOpen(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al aprobar la certificación';
      toast.error(errorMsg);
      setError(errorMsg);
      console.error('Error approving certification:', err);
    } finally {
      setIsApproving(false);
    }
  };

  /**
   * Open reject modal
   */
  const openRejectModal = (certificationId: string) => {
    setCertificationToReject(certificationId);
    setRejectReason('');
    setIsRejectModalOpen(true);
    // No cerramos el modal de vista para permitir al usuario ver los detalles mientras rechaza
  };

  /**
   * Close reject modal
   */
  const closeRejectModal = () => {
    if (!isRejecting) {
      setCertificationToReject(null);
      setRejectReason('');
      setIsRejectModalOpen(false);
    }
  };

  /**
   * Handle certification rejection
   */
  const handleReject = async () => {
    if (!certificationToReject || !rejectReason.trim()) return;
    
    setIsRejecting(true);
    
    try {
      await certificationService.rejectCertification(
        certificationToReject,
        user!.id,
        rejectReason
      );
      
      toast.success("Certificación rechazada exitosamente");
      
      // Close reject modal
      closeRejectModal();
      
      // Close view modal after successful rejection
      setIsViewModalOpen(false);
      
      // Refresh the certifications list
      fetchCertifications(paginationData.currentPage);
    } catch (err) {
      const errorMsg = err instanceof Error 
        ? err.message 
        : 'Error al rechazar la certificación';
      toast.error(errorMsg);
      setError(errorMsg);
      console.error('Error rejecting certification:', err);
    } finally {
      setIsRejecting(false);
    }
  };

  // Format dates nicely
  const formatDate = (date: string | Date | undefined): string => {
    if (!date) return 'No disponible';
    return new Date(date).toLocaleDateString('es-CO');
  };

  // Get status badge color and text
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">Pendiente</span>;
      case 'VERIFIED':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Verificado</span>;
      case 'REJECTED':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">Rechazado</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Aprobación de Certificaciones</h1>
        </div>
        
        {/* Error state */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{error}</p>
                <button 
                  onClick={() => fetchCertifications(paginationData.currentPage)}
                  className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-1"></div>
            <p className="mt-4 text-gray-600">Cargando certificaciones...</p>
          </div>
        ) : certifications.length === 0 && !error ? (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-8 text-center">
            <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay certificaciones disponibles</h3>
            <p className="text-gray-600 mb-4">
              No se encontraron certificaciones que coincidan con los criterios de búsqueda.
            </p>
            <button
              onClick={() => {
                // Reset filters and fetch again
                setCurrentFilter('');
                setFilterUserId('');
                setFilterSearch('');
                fetchCertifications(1);
              }} 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-1 hover:bg-green-0-9"
            >
              Limpiar filtros y reintentar
            </button>
          </div>
        ) : null}

        {/* Main table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange('status')}
                  >
                    Estado {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange('certificationType')}
                  >
                    Tipo {sortField === 'certificationType' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange('uploadedAt')}
                  >
                    Fecha de Subida {sortField === 'uploadedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certificado
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-1"></div>
                      </div>
                    </td>
                  </tr>
                ) : certifications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No hay certificaciones disponibles
                    </td>
                  </tr>
                ) : (
                  certifications.map((cert) => (
                    <tr key={cert.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(cert.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {cert.certificationType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            {cert.user.profileImage ? (
                              <img className="h-8 w-8 rounded-full" src={cert.user.profileImage} alt="" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-xs text-gray-600">
                                  {cert.user.firstName ? cert.user.firstName[0] : cert.user.username[0]}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {cert.user.firstName && cert.user.lastName
                                ? `${cert.user.firstName} ${cert.user.lastName}`
                                : cert.user.username}
                            </div>
                            <div className="text-xs text-gray-500">{cert.user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(cert.uploadedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{cert.certificateNumber || 'No específicado'}</div>
                        <div className="text-xs text-gray-500">{formatDate(cert.expiryDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleViewCertification(cert)}
                          className="text-green-1 hover:text-green-0-9 mr-3"
                        >
                          Ver
                        </button>
                        {cert.status === 'PENDING' && (
                          <>
                            <button 
                              onClick={() => handleApprove(cert.id)}
                              className="text-green-1 hover:text-green-0-9 mr-3"
                            >
                              Aprobar
                            </button>
                            <button 
                              onClick={() => openRejectModal(cert.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Rechazar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {paginationData.totalPages > 1 && (
            <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(paginationData.currentPage - 1)}
                  disabled={paginationData.currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    paginationData.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Anterior
                </button>
                <button
                  onClick={() => handlePageChange(paginationData.currentPage + 1)}
                  disabled={paginationData.currentPage === paginationData.totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    paginationData.currentPage === paginationData.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Siguiente
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{certifications.length > 0 ? (paginationData.currentPage - 1) * 10 + 1 : 0}</span> a{' '}
                    <span className="font-medium">
                      {Math.min(paginationData.currentPage * 10, paginationData.totalItems)}
                    </span> de <span className="font-medium">{paginationData.totalItems}</span> resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={paginationData.currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        paginationData.currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Primera</span>
                      &laquo;
                    </button>
                    <button
                      onClick={() => handlePageChange(paginationData.currentPage - 1)}
                      disabled={paginationData.currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                        paginationData.currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Anterior</span>
                      &lsaquo;
                    </button>
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, paginationData.totalPages) }, (_, i) => {
                      let pageNum;
                      if (paginationData.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (paginationData.currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (paginationData.currentPage >= paginationData.totalPages - 2) {
                        pageNum = paginationData.totalPages - 4 + i;
                      } else {
                        pageNum = paginationData.currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            paginationData.currentPage === pageNum
                              ? 'z-10 bg-green-1 text-white border-green-1'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handlePageChange(paginationData.currentPage + 1)}
                      disabled={paginationData.currentPage === paginationData.totalPages}
                      className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                        paginationData.currentPage === paginationData.totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Siguiente</span>
                      &rsaquo;
                    </button>
                    <button
                      onClick={() => handlePageChange(paginationData.totalPages)}
                      disabled={paginationData.currentPage === paginationData.totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        paginationData.currentPage === paginationData.totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Última</span>
                      &raquo;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
      
      {/* Rejection Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={closeRejectModal}
        title="Rechazar Certificación"
        size="md"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={closeRejectModal}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-0-5"
              disabled={isRejecting}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleReject}
              className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              disabled={isRejecting}
            >
              {isRejecting ? "Procesando..." : "Rechazar"}
            </button>
          </div>
        }
      >
        <p className="text-gray-700 mb-4">
          Por favor, indique el motivo por el cual está rechazando esta certificación.
        </p>
        <StyledTextArea
          name="rejectReason"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={4}
          placeholder="Ingresa la razón por la que rechazas esta certificación"
          required
        />
      </Modal>

      {/* View Certification Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detalles del Certificado"
        size="xl"
        footer={
          <div className="sm:flex sm:flex-row-reverse">
            {viewingCertification?.status === "PENDING" && (
              <>
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-1 text-base font-medium text-white hover:bg-green-0-9 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-1 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => handleApprove(viewingCertification?.id || '')}
                  disabled={isApproving}
                >
                  {isApproving ? "Aprobando..." : "Aprobar"}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-red-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => openRejectModal(viewingCertification?.id || '')}
                >
                  Rechazar
                </button>
              </>
            )}
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-1 sm:mt-0 sm:w-auto sm:text-sm"
              onClick={() => setIsViewModalOpen(false)}
            >
              Cerrar
            </button>
          </div>
        }
      >
        {viewingCertification && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column with certificate metadata */}
            <div className="md:w-full">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-md text-green-1 mb-2">Información del Usuario</h4>
                  <div className="flex items-center mb-4">
                    <div className="flex-shrink-0 h-10 w-10 bg-gray-300 rounded-full overflow-hidden">
                      {viewingCertification.user?.profileImage ? (
                        <img 
                          src={viewingCertification.user.profileImage} 
                          alt="Perfil"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = 'https://via.placeholder.com/40?text=U';
                          }}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-green-1 text-white">
                          {viewingCertification.user?.firstName?.[0] || viewingCertification.user?.username?.[0] || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">
                        {viewingCertification.user?.firstName && viewingCertification.user?.lastName 
                          ? `${viewingCertification.user.firstName} ${viewingCertification.user.lastName}`
                          : viewingCertification.user?.username || 'Usuario'}
                      </p>
                      <p className="text-xs text-gray-500">{viewingCertification.user?.email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium text-md text-green-1 mb-2">Detalles del Certificado</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Nombre</p>
                      <p className="font-medium">{viewingCertification.certificationName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tipo</p>
                      <p className="font-medium">{viewingCertification.certificationType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Número de Certificado</p>
                      <p className="font-medium">{viewingCertification.certificateNumber || 'No especificado'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Estado</p>
                      <div>{getStatusBadge(viewingCertification.status)}</div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fecha de Emisión</p>
                      <p className="font-medium">{formatDate(viewingCertification.issuedDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fecha de Vencimiento</p>
                      <p className="font-medium">{formatDate(viewingCertification.expiryDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fecha de Subida</p>
                      <p className="font-medium">{formatDate(viewingCertification.uploadedAt)}</p>
                    </div>
                  </div>
                </div>
                
                {viewingCertification.status === "REJECTED" && viewingCertification.rejectionReason && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-md text-red-500 mb-2">Motivo de Rechazo</h4>
                    <p className="text-sm text-gray-700 bg-red-50 p-3 rounded">
                      {viewingCertification.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right column with certificate image */}
            <div className="md:w-full flex flex-col">
              <h4 className="font-medium text-md text-green-1 mb-2">Imagen del Certificado</h4>
              <div className="border rounded-md overflow-hidden bg-white flex-grow flex items-center justify-center">
                {viewingCertification.imageUrl ? (
                  <div className="relative w-full h-full min-h-[300px] flex items-center justify-center">
                    <img 
                      src={viewingCertification.imageUrl} 
                      alt="Certification" 
                      className="max-w-full max-h-full object-contain p-2"
                      onError={(e) => {
                        // Handle image loading error with inline SVG
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        const container = target.parentElement;
                        if (container) {
                          container.innerHTML = `
                            <div class="flex flex-col items-center justify-center p-4 text-center">
                              <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <p class="mt-2 text-gray-500">No se pudo cargar la imagen</p>
                            </div>
                          `;
                        }
                      }}
                    />
                    <div className="absolute bottom-2 right-2">
                      <a 
                        href={viewingCertification.imageUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="bg-green-1 text-white rounded-full p-2 shadow hover:bg-green-0-9"
                        title="Ver imagen completa"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="mt-2 text-gray-500">No hay imagen disponible</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast notifications */}
      <ToastContainer 
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
};

export default CertificationApproval; 