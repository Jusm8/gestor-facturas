import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar, ProtectedRoute, AdminRoute, LogoutHandler, CheckBanRedirect } from './components';
import { Login, Register, Dashboard, Profile, Proyectos, NuevoProyecto, ProyectoDetalle, FormularioDocumento, ListaProductos, DetallePresupuesto, DetalleFactura, ListaClientes, FormularioCliente, FormularioProducto, AdminView, BannedPage, Contactanos, SobreNosotros, ForgotPassword } from './pages';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AuthProvider>
        <BrowserRouter>
          <CheckBanRedirect />
          <Navbar />
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/proyectos" element={<ProtectedRoute> <Proyectos /> </ProtectedRoute>} />
            <Route path="/dashboard/:idProyecto" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute> <Profile /> </ProtectedRoute>} />
            <Route path="/proyectos/nuevo" element={<ProtectedRoute><NuevoProyecto /></ProtectedRoute>} />
            <Route path="/proyectos/:id" element={<ProtectedRoute><ProyectoDetalle /></ProtectedRoute>} />
            <Route path="/presupuesto/:id/detalle" element={<DetallePresupuesto />} />
            <Route path="/factura/:id/detalle" element={<DetalleFactura />} />
            <Route path="/factura/:id" element={<ProtectedRoute><DetalleFactura /></ProtectedRoute>} />
            <Route path="/proyectos/:id/editar" element={<NuevoProyecto />} />
            <Route path="/proyectos/:proyectoId/crear" element={<FormularioDocumento />} />
            <Route path="/documento/:tipo/editar/:id" element={<FormularioDocumento />} />
            <Route path="/ListaClientes" element={<ProtectedRoute><ListaClientes /></ProtectedRoute>} />
            <Route path="/clientes/nuevo" element={<ProtectedRoute><FormularioCliente /></ProtectedRoute>} />
            <Route path="/clientes/editar/:id" element={<ProtectedRoute><FormularioCliente /></ProtectedRoute>} />
            <Route path="/productos" element={<ProtectedRoute><ListaProductos /></ProtectedRoute>} />
            <Route path="/productos/nuevo" element={<ProtectedRoute><FormularioProducto /></ProtectedRoute>} />
            <Route path="/productos/editar/:id" element={<ProtectedRoute><FormularioProducto /></ProtectedRoute>} />
            <Route path="/resumen" element={<AdminRoute><AdminView /></AdminRoute>} />
            <Route path="/baneado" element={<BannedPage />} />
            <Route path="/contactanos" element={<Contactanos />} />
            <Route path="/sobre-nosotros" element={<SobreNosotros />} />
            <Route path="/logout" element={<LogoutHandler />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </React.StrictMode>
  );

} else {
  console.error("No se encontró el elemento con id 'root'");
}
