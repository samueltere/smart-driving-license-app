import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  LogIn, 
  FileText, 
  Phone, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Menu, 
  X, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  LayoutDashboard,
  LogOut,
  ChevronRight,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Types
type View = 'home' | 'register' | 'admin_invite_register' | 'login' | 'forgot_password' | 'search' | 'contact' | 'update' | 'dashboard' | 'profile' | 'request_license' | 'admin' | 'payment' | 'confirmation';
type AdminTab = 'work' | 'expired' | 'new_registered' | 'administration';

interface User {
  id: number;
  full_name: string;
  role: string;
  email?: string;
  phone_number?: string;
  national_id?: string;
  license_number?: string;
}

interface License {
  id: string;
  full_name: string;
  issue_date: string;
  expiry_date: string;
  plate_info: string;
  status: string;
}

interface Application {
  id: number;
  user_id: number;
  license_number: string;
  national_id: string;
  status: 'pending' | 'approved' | 'rejected';
  paid: number;
  order_status?: 'ordered' | 'manufactured' | 'given';
  order_id?: number;
  receipt_transaction_id?: string;
  payment_method?: string;
  payment_amount?: number;
  payment_created_at?: string;
  created_at: string;
  user_name?: string;
}

interface Plate {
  id: number;
  plate_number: string;
  created_at: string;
}

interface ProfileChangeRequest {
  id: number;
  requested_full_name?: string;
  requested_national_id?: string;
  requested_license_number?: string;
  status: string;
  admin_note?: string;
  created_at: string;
}

interface UserLicenseRequest {
  id: number;
  where_learned?: string;
  passed_exam?: string;
  exam_score?: string;
  training_document?: string;
  coc_document?: string;
  status: string;
  admin_note?: string;
  created_at: string;
}

interface AdminProfileChangeRequest {
  id: number;
  user_id: number;
  current_full_name: string;
  current_national_id: string;
  current_license_number?: string;
  requested_full_name?: string;
  requested_national_id?: string;
  requested_license_number?: string;
  status: string;
  created_at: string;
}

interface AdminLicenseRequest {
  id: number;
  user_id: number;
  full_name: string;
  national_id: string;
  where_learned?: string;
  passed_exam?: string;
  exam_score?: string;
  training_document?: string;
  coc_document?: string;
  status: string;
  created_at: string;
}

interface AdminInvite {
  id: number;
  token: string;
  invited_full_name?: string;
  invited_phone?: string;
  invited_email: string;
  invited_password?: string;
  role: string;
  status: string;
  created_at: string;
  used_at?: string;
}

interface AdminAccount {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  created_at?: string;
}

interface AdminUser {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  national_id: string;
  license_number: string;
  role: string;
  profile_note?: string;
  license_document?: string;
  plate_document?: string;
  created_at?: string;
  issue_date?: string;
  expiry_date?: string;
  license_status?: string;
  plate_info?: string;
  is_expired: number;
  lifecycle_status?: 'new_registered' | 'active' | 'expired' | 'unassigned';
}

interface RegistrationForm {
  full_name: string;
  email: string;
  phone_number: string;
  national_id: string;
  has_license: 'yes' | 'no';
  license_number: string;
  issue_date: string;
  expiry_date: string;
  invite_token: string;
  password: string;
}

const defaultRegForm: RegistrationForm = {
  full_name: '',
  email: '',
  phone_number: '',
  national_id: '',
  has_license: 'no',
  license_number: '',
  issue_date: '',
  expiry_date: '',
  invite_token: '',
  password: '',
};

const getStoredRegForm = (): RegistrationForm => {
  try {
    const saved = localStorage.getItem('hdl_reg_form');
    if (!saved) return defaultRegForm;
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== 'object') return defaultRegForm;
    return {
      full_name: typeof parsed.full_name === 'string' ? parsed.full_name : '',
      email: typeof parsed.email === 'string' ? parsed.email : '',
      phone_number: typeof parsed.phone_number === 'string' ? parsed.phone_number : '',
      national_id: typeof parsed.national_id === 'string' ? parsed.national_id : '',
      has_license: parsed.has_license === 'yes' ? 'yes' : 'no',
      license_number: typeof parsed.license_number === 'string' ? parsed.license_number : '',
      issue_date: typeof parsed.issue_date === 'string' ? parsed.issue_date : '',
      expiry_date: typeof parsed.expiry_date === 'string' ? parsed.expiry_date : '',
      invite_token: typeof parsed.invite_token === 'string' ? parsed.invite_token : '',
      password: typeof parsed.password === 'string' ? parsed.password : '',
    };
  } catch {
    return defaultRegForm;
  }
};

export default function App() {
  const [view, setView] = useState<View>(() => {
    const saved = localStorage.getItem('hdl_view');
    return (saved as View) || 'home';
  });
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('hdl_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [searchId, setSearchId] = useState('');
  const [searchResult, setSearchResult] = useState<License | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userPlates, setUserPlates] = useState<Plate[]>([]);
  const [profileChangeRequests, setProfileChangeRequests] = useState<ProfileChangeRequest[]>([]);
  const [userLicenseRequests, setUserLicenseRequests] = useState<UserLicenseRequest[]>([]);
  const [profileEditForm, setProfileEditForm] = useState({
    full_name: '',
    national_id: '',
    license_number: '',
  });
  const [newPlateNumber, setNewPlateNumber] = useState('');
  const [licenseReqForm, setLicenseReqForm] = useState({
    where_learned: '',
    passed_exam: 'yes',
    exam_score: '',
  });
  const [trainingFile, setTrainingFile] = useState<File | null>(null);
  const [cocFile, setCocFile] = useState<File | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminAppExpiryDrafts, setAdminAppExpiryDrafts] = useState<Record<number, string>>({});
  const [adminProfileRequests, setAdminProfileRequests] = useState<AdminProfileChangeRequest[]>([]);
  const [adminLicenseRequests, setAdminLicenseRequests] = useState<AdminLicenseRequest[]>([]);
  const [adminInvites, setAdminInvites] = useState<AdminInvite[]>([]);
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [adminTab, setAdminTab] = useState<AdminTab>('work');
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [adminUserForm, setAdminUserForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    national_id: '',
    license_number: '',
    profile_note: '',
    plate_info: '',
    issue_date: '',
    expiry_date: '',
    license_status: 'active',
  });
  const [licenseDocFile, setLicenseDocFile] = useState<File | null>(null);
  const [plateDocFile, setPlateDocFile] = useState<File | null>(null);
  const [inviteForm, setInviteForm] = useState({
    full_name: '',
    email: '',
    role: 'user',
  });
  const [forgotForm, setForgotForm] = useState({
    email: '',
    otp: '',
    new_password: '',
    step: 'send' as 'send' | 'reset',
  });
  const [adminInviteForm, setAdminInviteForm] = useState({
    token: '',
    full_name: '',
    phone_number: '',
    email: '',
    password: '',
  });
  const [currentApp, setCurrentApp] = useState<any>(null);
  const [regStep, setRegStep] = useState<'form' | 'otp'>(() => {
    const saved = localStorage.getItem('hdl_reg_step');
    return (saved as 'form' | 'otp') || 'form';
  });
  const [otpValue, setOtpValue] = useState('');

  // Forms
  const [regForm, setRegForm] = useState<RegistrationForm>(getStoredRegForm);

  useEffect(() => {
    localStorage.setItem('hdl_view', view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem('hdl_user', user ? JSON.stringify(user) : '');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('hdl_reg_form', JSON.stringify(regForm));
  }, [regForm]);

  useEffect(() => {
    localStorage.setItem('hdl_reg_step', regStep);
  }, [regStep]);

  const [loginForm, setLoginForm] = useState({
    identifier: '',
    password: ''
  });

  const [updateForm, setUpdateForm] = useState({
    license_number: '',
    national_id: '',
    last_registration_date: '',
    expiry_date: '',
    documents: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    body: '',
  });

  const updateRegForm = (field: keyof RegistrationForm, value: string) => {
    setRegForm((prev) => ({ ...prev, [field]: value }));
  };

  const normalizeApiErrorMessage = (raw: unknown, fallback = 'Request failed.') => {
    const text = String(raw ?? '').trim();
    if (!text) return fallback;
    const looksLikeHtml = /<(?:!doctype|html|head|body)\b/i.test(text);
    if (looksLikeHtml) {
      return 'Service is temporarily unavailable. Please try again in a few minutes.';
    }
    return text.length > 240 ? `${text.slice(0, 240)}...` : text;
  };

  const fetchJsonWithTimeout = async (url: string, options: RequestInit, timeoutMs = 20000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      const raw = await res.text();
      let data: any = {};

      if (contentType.includes('application/json')) {
        try {
          data = raw ? JSON.parse(raw) : {};
        } catch {
          data = { error: 'Invalid JSON response from server.' };
        }
      } else {
        data = { error: normalizeApiErrorMessage(raw, 'Unexpected server response.') };
      }

      if (!res.ok) {
        data.error = normalizeApiErrorMessage(
          data.error || raw,
          `Request failed with status ${res.status}.`
        );
      }
      return { res, data };
    } catch (err: any) {
      if (err?.name === "AbortError") {
        throw new Error("Request timed out. Please try again.");
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  };

  const clearRegistrationForm = () => {
    setRegForm({ ...defaultRegForm });
    setOtpValue('');
    setRegStep('form');
    setError('');
    setInfo('');
    localStorage.removeItem('hdl_reg_form');
    localStorage.removeItem('hdl_reg_step');
  };

  const getFourYearExpiry = (issueDate: string) => {
    if (!issueDate) return '';
    const d = new Date(issueDate);
    if (Number.isNaN(d.getTime())) return '';
    d.setFullYear(d.getFullYear() + 4);
    return d.toISOString().split('T')[0];
  };

  const getReceiptDownloadHref = (app: Application) => {
    if (!app.receipt_transaction_id) return '#';
    const lines = [
      `Receipt: ${app.receipt_transaction_id}`,
      `Method: ${app.payment_method || 'N/A'}`,
      `Amount: ${app.payment_amount ?? 'N/A'} ETB`,
      `Payment Date: ${app.payment_created_at || 'N/A'}`,
      `Application ID: ${app.id}`,
      `License Number: ${app.license_number}`,
    ];
    return `data:text/plain;charset=utf-8,${encodeURIComponent(lines.join('\n'))}`;
  };

  useEffect(() => {
    if (user) {
      fetchUserApplications();
      fetchUserProfileData();
      if (user.role === 'admin') {
        fetchAdminApplications();
        fetchAdminUsers();
        fetchAdminProfileRequests();
        fetchAdminLicenseRequests();
        fetchAdminInvites();
        fetchAdminAccounts();
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user || user.role === 'admin') return;
    if (view === 'dashboard' || view === 'profile' || view === 'request_license') {
      fetchUserApplications();
      fetchUserProfileData();
    }
  }, [view, user]);

  useEffect(() => {
    if (!user || user.role === 'admin') return;
    if (!(view === 'dashboard' || view === 'profile' || view === 'request_license')) return;
    const timer = setInterval(() => {
      fetchUserApplications();
      fetchUserProfileData();
    }, 15000);
    return () => clearInterval(timer);
  }, [view, user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteToken = params.get('invite');
    if (!inviteToken) return;
    const loadInvite = async () => {
      try {
        const res = await fetch(`/api/invites/${inviteToken}`);
        const data = await res.json();
        if (!res.ok) return;
        if (data.role === 'admin') {
          setAdminInviteForm({
            token: data.token || inviteToken,
            full_name: data.invited_full_name || '',
            phone_number: data.invited_phone || '',
            email: data.invited_email || '',
            password: '',
          });
          setView('admin_invite_register');
        } else {
          setRegForm((prev) => ({
            ...prev,
            full_name: data.invited_full_name || prev.full_name,
            phone_number: data.invited_phone || prev.phone_number,
            email: data.invited_email || prev.email,
            password: data.invited_password || prev.password,
            invite_token: data.token || inviteToken,
          }));
          setView('register');
        }
      } catch {
        // ignore invite load errors
      }
    };
    loadInvite();
  }, []);

  const fetchUserApplications = async () => {
    if (!user) return;
    const res = await fetch(`/api/user/${user.id}/applications`);
    const data = await res.json();
    setApplications(data);
  };

  const fetchUserProfileData = async () => {
    if (!user) return;
    const res = await fetch(`/api/user/${user.id}/profile`);
    const data = await res.json();
    if (!res.ok) return;
    setUserProfile(data.user);
    setUserPlates(data.plates || []);
    setProfileChangeRequests(data.profile_changes || []);
    setUserLicenseRequests(data.license_requests || []);
    setProfileEditForm({
      full_name: data.user?.full_name || '',
      national_id: data.user?.national_id || '',
      license_number: data.user?.license_number || '',
    });
  };

  const fetchAdminApplications = async () => {
    const res = await fetch('/api/admin/applications');
    const data = await res.json();
    setApplications(data);
  };

  const fetchAdminUsers = async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setAdminUsers(data);
  };

  const fetchAdminProfileRequests = async () => {
    const res = await fetch('/api/admin/profile-change-requests');
    const data = await res.json();
    setAdminProfileRequests(data);
  };

  const fetchAdminLicenseRequests = async () => {
    const res = await fetch('/api/admin/license-requests');
    const data = await res.json();
    setAdminLicenseRequests(data);
  };

  const fetchAdminInvites = async () => {
    const res = await fetch('/api/admin/invites');
    const data = await res.json();
    setAdminInvites(data);
  };

  const fetchAdminAccounts = async () => {
    const res = await fetch('/api/admin/admins');
    const data = await res.json();
    setAdminAccounts(data);
  };

  const startEditAdminUser = (u: AdminUser) => {
    setEditingUserId(u.id);
    setAdminUserForm({
      full_name: u.full_name || '',
      email: u.email || '',
      phone_number: u.phone_number || '',
      national_id: u.national_id || '',
      license_number: u.license_number || '',
      profile_note: u.profile_note || '',
      plate_info: u.plate_info || '',
      issue_date: u.issue_date || '',
      expiry_date: u.expiry_date || '',
      license_status: u.license_status || 'active',
    });
    setLicenseDocFile(null);
    setPlateDocFile(null);
    setError('');
    setInfo('');
    setTimeout(() => {
      const panel = document.getElementById('admin-customize-panel');
      if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const cancelEditAdminUser = () => {
    setEditingUserId(null);
    setLicenseDocFile(null);
    setPlateDocFile(null);
  };

  const saveAdminUser = async () => {
    if (!editingUserId) return;
    setLoading(true);
    setError('');
    setInfo('');
    try {
      if (adminUserForm.license_number.trim()) {
        if (!adminUserForm.issue_date) {
          throw new Error('Issue date is required when assigning or updating a license.');
        }
        const expectedExpiry = getFourYearExpiry(adminUserForm.issue_date);
        if (!adminUserForm.expiry_date) {
          throw new Error(`Expiry date is required and must be ${expectedExpiry}.`);
        }
        if (adminUserForm.expiry_date !== expectedExpiry) {
          throw new Error(`Expiry date must be exactly 4 years after issue date (${expectedExpiry}).`);
        }
      }

      const target = adminUsers.find((u) => u.id === editingUserId);
      if (!target) throw new Error('User not found');

      let licenseDocument = target.license_document || '';
      let plateDocument = target.plate_document || '';

      if (licenseDocFile) {
        const formData = new FormData();
        formData.append('file', licenseDocFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'License document upload failed');
        licenseDocument = uploadData.filename;
      }

      if (plateDocFile) {
        const formData = new FormData();
        formData.append('file', plateDocFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Plate document upload failed');
        plateDocument = uploadData.filename;
      }

      const res = await fetch(`/api/admin/users/${editingUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...adminUserForm,
          license_document: licenseDocument,
          plate_document: plateDocument,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update user profile');
      }

      setInfo('User profile updated successfully.');
      setAdminTab('work');
      setEditingUserId(null);
      setLicenseDocFile(null);
      setPlateDocFile(null);
      await fetchAdminUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    try {
      if (regStep === 'form') {
        if (regForm.invite_token) {
          const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...regForm,
              has_license: regForm.has_license === 'yes',
              otp: '',
            }),
          });
          const data = await res.json();
          if (res.ok) {
            setUser(data);
            setView(data.role === 'admin' ? 'admin' : 'dashboard');
            setRegStep('form');
            setOtpValue('');
            setInfo('');
          } else {
            setError(data.error || 'Registration failed');
          }
          return;
        }

        if (regForm.has_license === 'yes') {
          if (!regForm.license_number.trim()) {
            setError('Please enter your license number.');
            return;
          }
          if (!regForm.issue_date) {
            setError('Please enter your license issue date.');
            return;
          }
          const expectedExpiry = getFourYearExpiry(regForm.issue_date);
          if (!expectedExpiry) {
            setError('Please enter a valid issue date.');
            return;
          }
          if (!regForm.expiry_date) {
            setError(`Expiry date is required and must be ${expectedExpiry}.`);
            return;
          }
          if (regForm.expiry_date !== expectedExpiry) {
            setError(`Expiry date must be exactly 4 years after issue date (${expectedExpiry}).`);
            return;
          }
        }

        const { res, data } = await fetchJsonWithTimeout('/api/otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: regForm.email })
        });
        if (res.ok) {
          setInfo(data.message || 'OTP sent to your email.');
          setRegStep('otp');
        } else {
          setError(data.error || 'Failed to send OTP');
        }
      } else {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...regForm,
            has_license: regForm.has_license === 'yes',
            otp: otpValue
          })
        });
        const data = await res.json();
        if (res.ok) {
          setUser(data);
          setView('dashboard');
          setRegStep('form');
          setOtpValue('');
          setInfo('');
        } else {
          setError(data.error);
        }
      }
    } catch (err) {
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setView(data.role === 'admin' ? 'admin' : 'dashboard');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/license/${searchId}`);
      const data = await res.json();
      if (res.ok) {
        setSearchResult(data);
      } else {
        setError(data.error);
        setSearchResult(null);
      }
    } catch (err) {
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      let documentPath = updateForm.documents;
      
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          documentPath = uploadData.filename;
        } else {
          throw new Error(uploadData.error || 'File upload failed');
        }
      }

      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updateForm, documents: documentPath, user_id: user.id })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentApp(data);
        setView('payment');
      }
    } catch (err: any) {
      setError(err.message || 'Application failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (method: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: currentApp.id,
          amount: 350,
          method
        })
      });
      if (res.ok) {
        setView('confirmation');
        fetchUserApplications();
      }
    } catch (err) {
      setError('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const updateAppStatus = async (id: number, status: string, expiryDate?: string) => {
    await fetch(`/api/admin/applications/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, expiry_date: expiryDate || null })
    });
    fetchAdminApplications();
    fetchAdminUsers();
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    fetchAdminApplications();
    fetchAdminUsers();
  };

  const updateProfileRequestStatus = async (id: number, status: string) => {
    await fetch(`/api/admin/profile-change-requests/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchAdminUsers();
    fetchAdminProfileRequests();
  };

  const updateLicenseRequestStatus = async (id: number, status: string) => {
    await fetch(`/api/admin/license-requests/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchAdminLicenseRequests();
  };

  const submitProfileChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const res = await fetch(`/api/user/${user.id}/profile-change-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileEditForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send profile change request');
      setInfo(data.message || 'Profile change request sent to admin.');
      await fetchUserProfileData();
    } catch (err: any) {
      setError(err.message || 'Failed to send profile change request');
    } finally {
      setLoading(false);
    }
  };

  const addPlate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPlateNumber.trim()) return;
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const res = await fetch(`/api/user/${user.id}/plates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plate_number: newPlateNumber.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add plate');
      setNewPlateNumber('');
      setInfo('Plate added successfully.');
      await fetchUserProfileData();
    } catch (err: any) {
      setError(err.message || 'Failed to add plate');
    } finally {
      setLoading(false);
    }
  };

  const deletePlate = async (plateId: number) => {
    if (!user) return;
    await fetch(`/api/user/${user.id}/plates/${plateId}`, { method: 'DELETE' });
    fetchUserProfileData();
  };

  const submitLicenseRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    setInfo('');
    try {
      let training_document = '';
      let coc_document = '';

      if (trainingFile) {
        const formData = new FormData();
        formData.append('file', trainingFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Training file upload failed');
        training_document = uploadData.filename;
      }

      if (cocFile) {
        const formData = new FormData();
        formData.append('file', cocFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'COC file upload failed');
        coc_document = uploadData.filename;
      }

      const res = await fetch(`/api/user/${user.id}/license-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...licenseReqForm, training_document, coc_document }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit license request');
      setInfo(data.message || 'License request submitted.');
      await fetchUserProfileData();
      setView('profile');
    } catch (err: any) {
      setError(err.message || 'Failed to submit license request');
    } finally {
      setLoading(false);
    }
  };

  const sendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const { res, data } = await fetchJsonWithTimeout('/api/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotForm.email }),
      });
      if (!res.ok) throw new Error(data.error || 'Failed to send reset code');
      setForgotForm((prev) => ({ ...prev, step: 'reset' }));
      setInfo(data.message || 'Verification code sent.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const resetForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const { res, data } = await fetchJsonWithTimeout('/api/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotForm.email,
          otp: forgotForm.otp,
          new_password: forgotForm.new_password,
        }),
      });
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      setInfo(data.message || 'Password reset successful.');
      setForgotForm({ email: '', otp: '', new_password: '', step: 'send' });
      setView('login');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const sendContactMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message');
      setInfo(data.message || 'Message sent successfully.');
      setContactForm({ name: '', phone: '', email: '', body: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const res = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...inviteForm, created_by: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invite');
      setInfo('Invite sent successfully.');
      setInviteForm({ full_name: '', email: '', role: 'user' });
      fetchAdminInvites();
    } catch (err: any) {
      setError(err.message || 'Failed to create invite');
    } finally {
      setLoading(false);
    }
  };

  const removeAdmin = async (adminId: number) => {
    if (!user) return;
    const res = await fetch(`/api/admin/admins/${adminId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actor_id: user.id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to remove admin');
      return;
    }
    fetchAdminAccounts();
  };

  const completeAdminInviteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const res = await fetch(`/api/invites/${adminInviteForm.token}/complete-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: adminInviteForm.full_name,
          phone_number: adminInviteForm.phone_number,
          email: adminInviteForm.email,
          password: adminInviteForm.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete admin registration');
      setUser(data);
      setView('admin');
    } catch (err: any) {
      setError(err.message || 'Failed to complete admin registration');
    } finally {
      setLoading(false);
    }
  };

  const Nav = () => (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => setView('home')}>
            <ShieldCheck className="h-8 w-8 text-emerald-600" />
            <span className="ml-2 text-xl font-bold text-gray-900 tracking-tight">Hossana DL</span>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => setView('search')} className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">Search</button>
            <button onClick={() => setView('contact')} className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">Contact</button>
            {!user ? (
              <>
                <button onClick={() => setView('login')} className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">Login</button>
                <button onClick={() => setView('register')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-all shadow-sm">Register</button>
              </>
            ) : (
              <>
                <button onClick={() => setView(user.role === 'admin' ? 'admin' : 'dashboard')} className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">Dashboard</button>
                <button onClick={() => { setUser(null); setView('home'); }} className="flex items-center text-gray-600 hover:text-red-600 font-medium transition-colors">
                  <LogOut className="h-4 w-4 mr-1" /> Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-600">
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              <button onClick={() => { setView('search'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-gray-600 font-medium">Search</button>
              <button onClick={() => { setView('contact'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-gray-600 font-medium">Contact</button>
              {!user ? (
                <>
                  <button onClick={() => { setView('login'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-gray-600 font-medium">Login</button>
                  <button onClick={() => { setView('register'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-emerald-600 font-bold">Register</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setView(user.role === 'admin' ? 'admin' : 'dashboard'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-gray-600 font-medium">Dashboard</button>
                  <button onClick={() => { setUser(null); setView('home'); setMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-red-600 font-medium">Logout</button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );

  const Home = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight tracking-tighter">
            Digitalize Your <span className="text-emerald-600">Driving License</span> Experience.
          </h1>
          <p className="mt-6 text-xl text-gray-600 leading-relaxed">
            Fast, secure, and transparent driving license services for the city of Hossana. Renew, update, and manage your documents from anywhere.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <button onClick={() => setView('register')} className="flex items-center justify-center bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            <button onClick={() => setView('search')} className="flex items-center justify-center bg-white border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-bold text-lg hover:border-emerald-600 hover:text-emerald-600 transition-all">
              Search License
            </button>
            <button onClick={() => setView('contact')} className="flex items-center justify-center bg-white border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-bold text-lg hover:border-emerald-600 hover:text-emerald-600 transition-all">
              Contact Us
            </button>
          </div>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative"
        >
          <div className="bg-emerald-50 rounded-3xl p-8 absolute -inset-4 -z-10 transform rotate-3"></div>
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <div className="space-y-6">
              <div className="flex items-center p-4 bg-emerald-50 rounded-2xl">
                <div className="bg-emerald-600 p-3 rounded-xl text-white">
                  <RefreshCw className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="font-bold text-gray-900">Easy Renewal</h3>
                  <p className="text-sm text-gray-600">Renew your license in minutes</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-blue-50 rounded-2xl">
                <div className="bg-blue-600 p-3 rounded-xl text-white">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="font-bold text-gray-900">Digital Payment</h3>
                  <p className="text-sm text-gray-600">Telebirr & CBE Birr integrated</p>
                </div>
              </div>
              <div className="flex items-center p-4 bg-purple-50 rounded-2xl">
                <div className="bg-purple-600 p-3 rounded-xl text-white">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className="font-bold text-gray-900">Secure Storage</h3>
                  <p className="text-sm text-gray-600">Your data is encrypted and safe</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: <UserPlus />, title: "Register", desc: "Create your digital profile with National ID", color: "emerald" },
          { icon: <Search />, title: "Search", desc: "Verify any license instantly by ID", color: "blue" },
          { icon: <FileText />, title: "Update", desc: "Submit renewal requests with documents", color: "purple" }
        ].map((item, i) => (
          <div key={i} className="bg-white p-8 rounded-2xl border border-gray-100 hover:shadow-xl transition-shadow group">
            <div className={`bg-${item.color}-100 text-${item.color}-600 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              {item.icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
            <p className="text-gray-600">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const Register = () => (
    <div className="max-w-md mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {regStep === 'form' ? 'Create Account' : 'Verify Email'}
        </h2>
        <p className="text-gray-600 mb-8">
          {regStep === 'form' ? "Join Hossana's digital license system" : `Enter the 4-digit code sent to ${regForm.email}`}
        </p>
        
        <form onSubmit={handleRegister} className="space-y-4">
          {regStep === 'form' ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  placeholder="Abebe Kebede"
                  value={regForm.full_name}
                  onChange={e => updateRegForm('full_name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input 
                  required
                  type="email" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  placeholder="name@example.com"
                  value={regForm.email}
                  onChange={e => updateRegForm('email', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                <input 
                  required
                  type="tel" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  placeholder="0911223344"
                  value={regForm.phone_number}
                  onChange={e => updateRegForm('phone_number', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">National ID</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    placeholder="ID-123"
                    value={regForm.national_id}
                    onChange={e => updateRegForm('national_id', e.target.value)}
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">License Option</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    value={regForm.has_license}
                    onChange={e => updateRegForm('has_license', e.target.value as 'yes' | 'no')}
                  >
                    <option value="yes">I have already license number</option>
                    <option value="no">I don't have license number</option>
                  </select>
                </div>
              </div>

              {regForm.has_license === 'yes' ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">License Number</label>
                    <input
                      required
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                      placeholder="DL-12345"
                      value={regForm.license_number}
                      onChange={e => updateRegForm('license_number', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Issue Date</label>
                      <input
                        required
                        type="date"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        value={regForm.issue_date}
                        onChange={e => {
                          const issue = e.target.value;
                          const expected = getFourYearExpiry(issue);
                          setRegForm((prev) => ({
                            ...prev,
                            issue_date: issue,
                            expiry_date: expected || prev.expiry_date
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Expiry Date</label>
                      <input
                        required
                        type="date"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        value={regForm.expiry_date}
                        onChange={e => updateRegForm('expiry_date', e.target.value)}
                      />
                    </div>
                  </div>
                  {regForm.issue_date && regForm.expiry_date && regForm.expiry_date !== getFourYearExpiry(regForm.issue_date) && (
                    <p className="text-amber-700 text-sm font-medium">
                      Warning: Expiry date must be exactly 4 years after issue date ({getFourYearExpiry(regForm.issue_date)}).
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                  New registered user without license will appear in the "New Registered" admin tab for license assignment.
                </p>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                <input 
                  required
                  type="password" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  value={regForm.password}
                  onChange={e => updateRegForm('password', e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={clearRegistrationForm}
                className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all"
              >
                Clear Form
              </button>
            </>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Verification Code</label>
              <input 
                required
                type="text" 
                maxLength={4}
                className="w-full px-4 py-4 text-center text-3xl tracking-[1em] font-bold rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                placeholder="0000"
                value={otpValue}
                onChange={e => setOtpValue(e.target.value)}
              />
              <button 
                type="button"
                onClick={() => setRegStep('form')}
                className="mt-4 text-sm text-emerald-600 font-bold hover:underline"
              >
                Change Email
              </button>
              <button
                type="button"
                onClick={clearRegistrationForm}
                className="mt-3 text-sm text-gray-600 font-semibold hover:underline"
              >
                Clear Form
              </button>
            </div>
          )}
          
          {info && <p className="text-emerald-600 text-sm font-medium">{info}</p>}
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          <button 
            disabled={loading}
            type="submit" 
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
          >
            {loading
              ? 'Processing...'
              : (regStep === 'form'
                ? (regForm.invite_token ? 'Register From Invite' : 'Send OTP')
                : 'Verify & Register')}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600">
          Already have an account? <button onClick={() => setView('login')} className="text-emerald-600 font-bold hover:underline">Login</button>
        </p>
      </motion.div>
    </div>
  );

  const Login = () => (
    <div className="max-w-md mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
        <p className="text-gray-600 mb-8">Login to manage your license</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone, Email, or License ID</label>
            <input 
              required
              type="text" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder="0911..., name@example.com, or DL-..."
              value={loginForm.identifier}
              onChange={e => setLoginForm({...loginForm, identifier: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
            <input 
              required
              type="password" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              value={loginForm.password}
              onChange={e => setLoginForm({...loginForm, password: e.target.value})}
            />
          </div>
          <div className="text-right -mt-2">
            <button type="button" onClick={() => setView('forgot_password')} className="text-sm text-emerald-600 font-semibold hover:underline">
              Forgot password?
            </button>
          </div>
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          <button 
            disabled={loading}
            type="submit" 
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="mt-6 text-center text-gray-600">
          New user? <button onClick={() => setView('register')} className="text-emerald-600 font-bold hover:underline">Register</button>
        </p>
      </motion.div>
    </div>
  );

  const ForgotPassword = () => (
    <div className="max-w-md mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password</h2>
        <p className="text-gray-600 mb-8">
          {forgotForm.step === 'send' ? 'Enter your email to get verification code.' : 'Enter OTP and new password.'}
        </p>

        <form onSubmit={forgotForm.step === 'send' ? sendForgotOtp : resetForgotPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input
              required
              type="email"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              value={forgotForm.email}
              onChange={e => setForgotForm({ ...forgotForm, email: e.target.value })}
            />
          </div>
          {forgotForm.step === 'reset' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Verification Code</label>
                <input
                  required
                  type="text"
                  maxLength={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  value={forgotForm.otp}
                  onChange={e => setForgotForm({ ...forgotForm, otp: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
                <input
                  required
                  type="password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  value={forgotForm.new_password}
                  onChange={e => setForgotForm({ ...forgotForm, new_password: e.target.value })}
                />
              </div>
            </>
          )}
          {info && <p className="text-emerald-600 text-sm font-medium">{info}</p>}
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          <button disabled={loading} type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all disabled:opacity-50">
            {loading ? 'Processing...' : (forgotForm.step === 'send' ? 'Send Code' : 'Reset Password')}
          </button>
          <button type="button" onClick={() => setView('login')} className="w-full border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all">
            Back to Login
          </button>
        </form>
      </motion.div>
    </div>
  );

  const AdminInviteRegister = () => (
    <div className="max-w-md mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Admin Registration</h2>
        <p className="text-gray-600 mb-8">Complete your invited admin account setup.</p>
        <form onSubmit={completeAdminInviteRegistration} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
            <input required type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200" value={adminInviteForm.full_name} onChange={e => setAdminInviteForm({ ...adminInviteForm, full_name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
            <input required type="text" className="w-full px-4 py-3 rounded-xl border border-gray-200" value={adminInviteForm.phone_number} onChange={e => setAdminInviteForm({ ...adminInviteForm, phone_number: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
            <input required type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50" value={adminInviteForm.email} onChange={e => setAdminInviteForm({ ...adminInviteForm, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
            <input required type="password" className="w-full px-4 py-3 rounded-xl border border-gray-200" value={adminInviteForm.password} onChange={e => setAdminInviteForm({ ...adminInviteForm, password: e.target.value })} />
          </div>
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          <button disabled={loading} type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Admin Account'}
          </button>
        </form>
      </motion.div>
    </div>
  );

  const SearchLicense = () => (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Search License</h2>
        <p className="text-gray-600 mb-8">Verify license details instantly</p>
        
        <form onSubmit={handleSearch} className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input 
              required
              type="text" 
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              placeholder="Enter License ID (e.g. DL-12345)"
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
            />
          </div>
          <button 
            disabled={loading}
            type="submit" 
            className="bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            Search
          </button>
        </form>

        {error && (
          <div className="text-center mb-4">
            <p className="text-red-500 mb-2">{error}</p>
            {error === 'License not found' && (
              <button 
                onClick={() => {
                  setRegForm({...regForm, license_number: searchId});
                  setView('register');
                  setError('');
                }}
                className="text-emerald-600 font-bold hover:underline"
              >
                New user? Register now to generate a license.
              </button>
            )}
          </div>
        )}

        {searchResult && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-50 rounded-2xl p-6 border border-gray-200"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{searchResult.full_name}</h3>
                <p className="text-emerald-600 font-mono font-bold">{searchResult.id}</p>
              </div>
              <span className={`px-4 py-1 rounded-full text-sm font-bold ${searchResult.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                {searchResult.status.toUpperCase()}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Issue Date</p>
                <p className="font-medium text-gray-900">{searchResult.issue_date}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Expiry Date</p>
                <p className="font-medium text-gray-900">{searchResult.expiry_date}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Plate Information</p>
                <p className="font-medium text-gray-900">{searchResult.plate_info || 'N/A'}</p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );

  const Contact = () => (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Contact Us</h2>
          <p className="text-gray-600 mb-6">Send your message and our office will reply to your email.</p>
          <form onSubmit={sendContactMessage} className="space-y-4">
            <input
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Your Name"
              value={contactForm.name}
              onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
            />
            <input
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Phone Number"
              value={contactForm.phone}
              onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
            />
            <input
              required
              type="email"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Email Address"
              value={contactForm.email}
              onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
            />
            <textarea
              required
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Write your message"
              value={contactForm.body}
              onChange={(e) => setContactForm({ ...contactForm, body: e.target.value })}
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {info && <p className="text-emerald-700 text-sm">{info}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">About Hossana DL</h3>
          <p className="text-gray-700 leading-relaxed mb-6">
            Hossana DL is a digital driving license service platform for registration, license updates,
            and follow-up of license requests. We help citizens and administrators process services faster.
          </p>
          <div className="space-y-3 text-gray-700">
            <p><span className="font-semibold text-gray-900">Office:</span> Hossana City Driving License Office</p>
            <p><span className="font-semibold text-gray-900">Phone:</span> +251-900-000-000</p>
            <p><span className="font-semibold text-gray-900">Email:</span> SMTP sender email configured on server (`SMTP_FROM`)</p>
            <p><span className="font-semibold text-gray-900">Working Hours:</span> Monday - Friday, 8:30 AM - 5:30 PM</p>
          </div>
        </div>
      </div>
    </div>
  );

  const Dashboard = () => (
    (() => {
      const latestLicenseRequest = userLicenseRequests.length > 0 ? userLicenseRequests[0] : null;
      const canUpdateLicense = Boolean(user?.license_number || latestLicenseRequest?.status === 'approved');
      const userActionLabel = canUpdateLicense ? 'Update License' : 'Request License';
      const userActionView: View = canUpdateLicense ? 'update' : 'request_license';

      return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome, {user?.full_name}</h2>
          <p className="text-gray-600">Manage your license and applications</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setView('profile')}
            className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-bold hover:border-emerald-600 hover:text-emerald-700 transition-all flex items-center"
          >
            <ShieldCheck className="h-5 w-5 mr-2" /> My Profile
          </button>
          {canUpdateLicense ? (
            <button 
              onClick={() => {
                setUpdateForm({
                  ...updateForm,
                  license_number: user?.license_number || '',
                  national_id: user?.national_id || ''
                });
                setView(userActionView);
              }}
              className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center"
            >
              <RefreshCw className="h-5 w-5 mr-2" /> {userActionLabel}
            </button>
          ) : (
            <button
              onClick={() => setView(userActionView)}
              className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center"
            >
              <FileText className="h-5 w-5 mr-2" /> {userActionLabel}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="bg-blue-100 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Status</p>
          <p className="text-2xl font-bold text-gray-900">
            {latestLicenseRequest ? latestLicenseRequest.status.toUpperCase() : 'ACTIVE'}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="bg-emerald-100 text-emerald-600 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
            <FileText className="h-5 w-5" />
          </div>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Applications</p>
          <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="bg-purple-100 text-purple-600 w-10 h-10 rounded-lg flex items-center justify-center mb-4">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">License ID</p>
          <p className="text-2xl font-bold text-gray-900">{user?.license_number || 'None'}</p>
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Applications</h3>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {applications.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No applications found</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">License No</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Order Tracking</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Receipt / Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(app.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">{app.license_number}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${app.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {app.paid ? 'PAID' : 'UNPAID'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {app.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {app.order_status ? (
                      <div className="flex items-center text-xs font-bold text-gray-600">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          app.order_status === 'given' ? 'bg-emerald-500' :
                          app.order_status === 'manufactured' ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`}></div>
                        {app.order_status.toUpperCase()}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {app.receipt_transaction_id ? (
                        <a
                          href={getReceiptDownloadHref(app)}
                          download={`receipt-${app.receipt_transaction_id}.txt`}
                          className="text-blue-600 hover:text-blue-700 flex items-center text-xs font-bold"
                        >
                          <FileText className="h-3 w-3 mr-1" /> Receipt ({app.receipt_transaction_id})
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">No Receipt</span>
                      )}
                      {app.documents ? (
                        <div className="flex gap-2">
                          <a 
                            href={`/uploads/${app.documents}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 flex items-center text-xs font-bold"
                          >
                            <FileText className="h-3 w-3 mr-1" /> View Doc
                          </a>
                          <a
                            href={`/uploads/${app.documents}`}
                            download
                            className="text-blue-600 hover:text-blue-700 text-xs font-bold"
                          >
                            Download
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">No File</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-6 mt-10">License Request Status</h3>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {userLicenseRequests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No license requests submitted yet.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Where Learned</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Exam</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Admin Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {userLicenseRequests.map((r) => (
                <tr key={r.id}>
                  <td className="px-6 py-4 text-sm text-gray-700">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{r.where_learned || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{r.passed_exam || 'N/A'} {r.exam_score ? `(${r.exam_score})` : ''}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                      r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {r.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{r.admin_note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
      );
    })()
  );

  const UpdateLicense = () => (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Update License</h2>
        <p className="text-gray-600 mb-8">Submit your renewal or update request</p>
        
        <form onSubmit={handleUpdateSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">License Number</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={updateForm.license_number}
                onChange={e => setUpdateForm({...updateForm, license_number: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">National ID</label>
              <input 
                required
                type="text" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={updateForm.national_id}
                onChange={e => setUpdateForm({...updateForm, national_id: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Last Reg. Date</label>
              <input 
                required
                type="date" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={updateForm.last_registration_date}
                onChange={e => setUpdateForm({...updateForm, last_registration_date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Expiration Date</label>
              <input 
                required
                type="date" 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={updateForm.expiry_date}
                onChange={e => setUpdateForm({...updateForm, expiry_date: e.target.value})}
              />
            </div>
          </div>
          
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer relative">
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">
              {selectedFile ? selectedFile.name : 'Upload National ID & Old License'}
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF, JPG or PNG up to 10MB</p>
          </div>

          <button 
            disabled={loading}
            type="submit" 
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
          >
            {loading ? 'Submitting...' : 'Proceed to Payment'}
          </button>
        </form>
      </motion.div>
    </div>
  );

  const Profile = () => (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center mb-8">
        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xl flex items-center justify-center mr-4">
          {userProfile?.full_name?.[0] || 'U'}
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Profile</h2>
          <p className="text-gray-600">View details, request profile changes, and manage plates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Formal Details</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-semibold text-gray-700">Name:</span> {userProfile?.full_name || '-'}</p>
            <p><span className="font-semibold text-gray-700">Email:</span> {userProfile?.email || '-'}</p>
            <p><span className="font-semibold text-gray-700">Phone:</span> {userProfile?.phone_number || '-'}</p>
            <p><span className="font-semibold text-gray-700">National ID:</span> {userProfile?.national_id || '-'}</p>
            <p><span className="font-semibold text-gray-700">License ID:</span> {userProfile?.license_number || 'Not assigned yet'}</p>
            <p><span className="font-semibold text-gray-700">License Status:</span> {userProfile?.license_status || 'N/A'}</p>
          </div>
          <div className="mt-4 text-sm">
            <p className="font-semibold text-gray-700 mb-2">License Documents</p>
            {userProfile?.license_document ? (
              <div className="flex gap-2">
                <a className="text-emerald-600 hover:underline block" href={`/uploads/${userProfile.license_document}`} target="_blank" rel="noopener noreferrer">View License Document</a>
                <a className="text-blue-600 hover:underline block" href={`/uploads/${userProfile.license_document}`} download>Download</a>
              </div>
            ) : <p className="text-gray-500">No license document uploaded.</p>}
            {userProfile?.plate_document ? (
              <div className="flex gap-2 mt-1">
                <a className="text-emerald-600 hover:underline block" href={`/uploads/${userProfile.plate_document}`} target="_blank" rel="noopener noreferrer">View Plate Document</a>
                <a className="text-blue-600 hover:underline block" href={`/uploads/${userProfile.plate_document}`} download>Download</a>
              </div>
            ) : <p className="text-gray-500 mt-1">No plate document uploaded.</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Request Profile Change</h3>
          <form onSubmit={submitProfileChangeRequest} className="space-y-3">
            <input className="w-full px-4 py-3 rounded-xl border border-gray-200" placeholder="Full Name" value={profileEditForm.full_name} onChange={(e) => setProfileEditForm({ ...profileEditForm, full_name: e.target.value })} />
            <input className="w-full px-4 py-3 rounded-xl border border-gray-200" placeholder="National ID" value={profileEditForm.national_id} onChange={(e) => setProfileEditForm({ ...profileEditForm, national_id: e.target.value })} />
            <input className="w-full px-4 py-3 rounded-xl border border-gray-200" placeholder="License ID (if you have)" value={profileEditForm.license_number} onChange={(e) => setProfileEditForm({ ...profileEditForm, license_number: e.target.value })} />
            <button disabled={loading} type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50">
              {loading ? 'Sending...' : 'Send Request to Admin'}
            </button>
          </form>
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-700 mb-2">Recent Profile Requests</p>
            {profileChangeRequests.length === 0 ? <p className="text-sm text-gray-500">No requests yet.</p> : (
              <ul className="space-y-2 text-sm">
                {profileChangeRequests.slice(0, 4).map((r) => (
                  <li key={r.id} className="border border-gray-100 rounded-lg px-3 py-2">
                    <span className="font-semibold">{r.status.toUpperCase()}</span> - {new Date(r.created_at).toLocaleDateString()}
                    {r.admin_note ? <span className="block text-gray-600 mt-1">Admin note: {r.admin_note}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">My Plates</h3>
        <form onSubmit={addPlate} className="flex gap-3 mb-4">
          <input className="flex-1 px-4 py-3 rounded-xl border border-gray-200" placeholder="Enter plate number" value={newPlateNumber} onChange={(e) => setNewPlateNumber(e.target.value)} />
          <button type="submit" className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700">Add Plate</button>
        </form>
        {userPlates.length === 0 ? <p className="text-sm text-gray-500">No plate added yet.</p> : (
          <div className="space-y-2">
            {userPlates.map((p) => (
              <div key={p.id} className="flex justify-between items-center border border-gray-100 rounded-lg px-3 py-2">
                <div>
                  <p className="font-semibold text-gray-900">{p.plate_number}</p>
                  <p className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => deletePlate(p.id)} className="text-red-600 font-semibold text-sm hover:underline">Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const RequestLicense = () => (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Request License</h2>
        <p className="text-gray-600 mb-8">Fill your learning and exam info. Admin will review and assign your license.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"><span className="font-semibold">Name:</span> {userProfile?.full_name || user?.full_name}</div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"><span className="font-semibold">Email:</span> {userProfile?.email || user?.email}</div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"><span className="font-semibold">Phone:</span> {userProfile?.phone_number || user?.phone_number}</div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"><span className="font-semibold">National ID:</span> {userProfile?.national_id || user?.national_id}</div>
        </div>

        <form onSubmit={submitLicenseRequest} className="space-y-4">
          <input className="w-full px-4 py-3 rounded-xl border border-gray-200" placeholder="Where did you learn driving?" value={licenseReqForm.where_learned} onChange={(e) => setLicenseReqForm({ ...licenseReqForm, where_learned: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <select className="w-full px-4 py-3 rounded-xl border border-gray-200" value={licenseReqForm.passed_exam} onChange={(e) => setLicenseReqForm({ ...licenseReqForm, passed_exam: e.target.value })}>
              <option value="yes">Passed Exam</option>
              <option value="no">Did Not Pass</option>
            </select>
            <input className="w-full px-4 py-3 rounded-xl border border-gray-200" placeholder="Exam score/result (e.g. 78%)" value={licenseReqForm.exam_score} onChange={(e) => setLicenseReqForm({ ...licenseReqForm, exam_score: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-sm text-gray-700">
              Upload training certificate/document
              <input type="file" className="block mt-2" onChange={(e) => setTrainingFile(e.target.files?.[0] || null)} />
            </label>
            <label className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-sm text-gray-700">
              Upload COC / test result
              <input type="file" className="block mt-2" onChange={(e) => setCocFile(e.target.files?.[0] || null)} />
            </label>
          </div>
          <button disabled={loading} type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50">
            {loading ? 'Submitting...' : 'Submit License Request'}
          </button>
        </form>
      </motion.div>
    </div>
  );

  const Payment = () => (
    <div className="max-w-md mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment</h2>
        <p className="text-gray-600 mb-8">Select your preferred payment method</p>
        
        <div className="bg-emerald-50 p-6 rounded-2xl mb-8 flex justify-between items-center">
          <span className="text-gray-700 font-medium">Total Amount</span>
          <span className="text-2xl font-bold text-emerald-600">350 ETB</span>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => handlePayment('Telebirr')}
            className="w-full flex items-center justify-between p-4 border-2 border-gray-100 rounded-2xl hover:border-emerald-600 hover:bg-emerald-50 transition-all group"
          >
            <div className="flex items-center">
              <div className="bg-blue-600 text-white p-2 rounded-lg mr-4">TB</div>
              <span className="font-bold text-gray-900">Telebirr</span>
            </div>
            <ChevronRight className="text-gray-400 group-hover:text-emerald-600" />
          </button>
          <button 
            onClick={() => handlePayment('CBE Birr')}
            className="w-full flex items-center justify-between p-4 border-2 border-gray-100 rounded-2xl hover:border-emerald-600 hover:bg-emerald-50 transition-all group"
          >
            <div className="flex items-center">
              <div className="bg-purple-600 text-white p-2 rounded-lg mr-4">CB</div>
              <span className="font-bold text-gray-900">CBE Birr</span>
            </div>
            <ChevronRight className="text-gray-400 group-hover:text-emerald-600" />
          </button>
        </div>
      </motion.div>
    </div>
  );

  const Confirmation = () => (
    <div className="max-w-md mx-auto px-4 py-12 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-12 rounded-3xl shadow-xl border border-gray-100">
        <div className="bg-emerald-100 text-emerald-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
        <p className="text-gray-600 mb-8">Your application has been submitted and is currently under review by the Hossana DL Office.</p>
        
        <div className="bg-gray-50 p-4 rounded-xl mb-8 text-left">
          <div className="flex justify-between mb-2">
            <span className="text-gray-500 text-sm">Status</span>
            <span className="text-yellow-600 font-bold text-sm">PENDING</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Ref Number</span>
            <span className="text-gray-900 font-mono text-sm">#HOS-{Math.floor(Math.random() * 100000)}</span>
          </div>
        </div>

        <button 
          onClick={() => setView('dashboard')}
          className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all"
        >
          Back to Dashboard
        </button>
      </motion.div>
    </div>
  );

  const Admin = () => {
    const workUsers = adminUsers.filter((u) => u.lifecycle_status === 'active' && Boolean((u.license_number || '').trim()));
    const expiredUsers = adminUsers.filter((u) => u.lifecycle_status === 'expired');
    const newRegisteredUsers = adminUsers.filter((u) => u.lifecycle_status === 'new_registered');
    const editingUser = editingUserId ? adminUsers.find((u) => u.id === editingUserId) : null;
    const editingUserLatestLicenseReq = editingUserId
      ? adminLicenseRequests.find((r) => r.user_id === editingUserId)
      : null;

    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Admin Panel</h2>
            <p className="text-gray-600">Manage active work list, expired licenses, and newly registered users</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-bold">
              Work: {workUsers.length}
            </div>
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-bold">
              Expired: {expiredUsers.length}
            </div>
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-bold">
              New Registered: {newRegisteredUsers.length}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setAdminTab('work')}
            className={`px-4 py-2 rounded-lg font-semibold ${adminTab === 'work' ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
          >
            Work
          </button>
          <button
            onClick={() => setAdminTab('expired')}
            className={`px-4 py-2 rounded-lg font-semibold ${adminTab === 'expired' ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
          >
            Expired Licenses
          </button>
          <button
            onClick={() => setAdminTab('new_registered')}
            className={`px-4 py-2 rounded-lg font-semibold ${adminTab === 'new_registered' ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
          >
            New Registered
          </button>
          <button
            onClick={() => setAdminTab('administration')}
            className={`px-4 py-2 rounded-lg font-semibold ${adminTab === 'administration' ? 'bg-emerald-600 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
          >
            Administration
          </button>
        </div>

        {adminTab === 'work' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">License</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Issue Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Expiry Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {workUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{u.full_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{u.phone_number}</td>
                      <td className="px-6 py-4 text-sm font-mono text-emerald-700">{u.license_number || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{u.issue_date || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{u.expiry_date || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-700">ACTIVE</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => startEditAdminUser(u)} className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">
                          Customize
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Update License Requests</h3>
              </div>
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">License</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Requested Expiry</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Set New Expiry</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Files</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {applications.filter((app) => app.status === 'pending').map((app) => (
                    <tr key={app.id}>
                      <td className="px-6 py-4 text-sm text-gray-700">{app.user_name}</td>
                      <td className="px-6 py-4 text-sm font-mono text-emerald-700">{app.license_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{app.expiry_date || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <input
                          type="date"
                          className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                          value={adminAppExpiryDrafts[app.id] || app.expiry_date || ''}
                          onChange={(e) => setAdminAppExpiryDrafts((prev) => ({ ...prev, [app.id]: e.target.value }))}
                        />
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                          app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                          app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {app.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {app.documents ? (
                          <div className="flex gap-2">
                            <a href={`/uploads/${app.documents}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                              View
                            </a>
                            <a href={`/uploads/${app.documents}`} download className="text-blue-600 hover:underline">
                              Download
                            </a>
                          </div>
                        ) : (
                          <span className="text-gray-400">No file</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => updateAppStatus(app.id, 'approved', adminAppExpiryDrafts[app.id] || app.expiry_date)}
                          className="px-3 py-1 rounded bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateAppStatus(app.id, 'rejected')}
                          className="px-3 py-1 rounded bg-red-600 text-white text-xs font-bold hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {adminTab === 'expired' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Person</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">License</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Issue Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Expiry Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Plate</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Documents</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expiredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{u.full_name}</div>
                      <div className="text-xs text-gray-500">{u.phone_number}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-emerald-700 font-bold">{u.license_number || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{u.issue_date || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-red-700 font-bold">{u.expiry_date || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{u.plate_info || 'N/A'}</td>
                    <td className="px-6 py-4 text-xs">
                      {u.license_document && (
                        <span className="mr-3">
                          <a href={`/uploads/${u.license_document}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline mr-1">License Doc</a>
                          <a href={`/uploads/${u.license_document}`} download className="text-blue-600 hover:underline">Download</a>
                        </span>
                      )}
                      {u.plate_document && (
                        <span>
                          <a href={`/uploads/${u.plate_document}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline mr-1">Plate Doc</a>
                          <a href={`/uploads/${u.plate_document}`} download className="text-blue-600 hover:underline">Download</a>
                        </span>
                      )}
                      {!u.license_document && !u.plate_document && <span className="text-gray-500">No docs</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => startEditAdminUser(u)} className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">
                        Customize
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {adminTab === 'new_registered' && (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">National ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Registered</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {newRegisteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{u.full_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{u.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{u.phone_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{u.national_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => startEditAdminUser(u)} className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">
                          Assign License
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </>
        )}

        {editingUserId && (
          <div id="admin-customize-panel" className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Customize User Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="px-4 py-3 rounded-xl border border-gray-200" placeholder="Full Name" value={adminUserForm.full_name} onChange={(e) => setAdminUserForm({ ...adminUserForm, full_name: e.target.value })} />
              <input className="px-4 py-3 rounded-xl border border-gray-200" placeholder="Email" value={adminUserForm.email} onChange={(e) => setAdminUserForm({ ...adminUserForm, email: e.target.value })} />
              <input className="px-4 py-3 rounded-xl border border-gray-200" placeholder="Phone Number" value={adminUserForm.phone_number} onChange={(e) => setAdminUserForm({ ...adminUserForm, phone_number: e.target.value })} />
              <input className="px-4 py-3 rounded-xl border border-gray-200" placeholder="National ID" value={adminUserForm.national_id} onChange={(e) => setAdminUserForm({ ...adminUserForm, national_id: e.target.value })} />
              <input className="px-4 py-3 rounded-xl border border-gray-200" placeholder="License Number" value={adminUserForm.license_number} onChange={(e) => setAdminUserForm({ ...adminUserForm, license_number: e.target.value })} />
              <input className="px-4 py-3 rounded-xl border border-gray-200" placeholder="Plate Info" value={adminUserForm.plate_info} onChange={(e) => setAdminUserForm({ ...adminUserForm, plate_info: e.target.value })} />
              <input type="date" className="px-4 py-3 rounded-xl border border-gray-200" value={adminUserForm.issue_date} onChange={(e) => {
                const issue = e.target.value;
                setAdminUserForm({ ...adminUserForm, issue_date: issue, expiry_date: getFourYearExpiry(issue) || adminUserForm.expiry_date });
              }} />
              <input type="date" className="px-4 py-3 rounded-xl border border-gray-200" value={adminUserForm.expiry_date} onChange={(e) => setAdminUserForm({ ...adminUserForm, expiry_date: e.target.value })} />
              <select className="px-4 py-3 rounded-xl border border-gray-200" value={adminUserForm.license_status} onChange={(e) => setAdminUserForm({ ...adminUserForm, license_status: e.target.value })}>
                <option value="active">ACTIVE</option>
                <option value="expired">EXPIRED</option>
                <option value="suspended">SUSPENDED</option>
              </select>
            </div>
            {adminUserForm.issue_date && adminUserForm.expiry_date && adminUserForm.expiry_date !== getFourYearExpiry(adminUserForm.issue_date) && (
              <p className="mt-3 text-amber-700 text-sm font-medium">
                Expiry must be 4 years after issue date ({getFourYearExpiry(adminUserForm.issue_date)}).
              </p>
            )}
            <textarea className="mt-4 w-full px-4 py-3 rounded-xl border border-gray-200" rows={3} placeholder="Profile note" value={adminUserForm.profile_note} onChange={(e) => setAdminUserForm({ ...adminUserForm, profile_note: e.target.value })} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <label className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-sm text-gray-700">
                Upload License Document
                <input type="file" className="block mt-2" onChange={(e) => setLicenseDocFile(e.target.files?.[0] || null)} />
              </label>
              <label className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-sm text-gray-700">
                Upload Plate Document
                <input type="file" className="block mt-2" onChange={(e) => setPlateDocFile(e.target.files?.[0] || null)} />
              </label>
            </div>

            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm">
              <p className="font-semibold text-gray-900 mb-2">Available User Documents</p>
              <div className="space-y-1">
                {editingUser?.license_document && (
                  <div className="flex gap-2">
                    <a className="text-emerald-700 hover:underline block" href={`/uploads/${editingUser.license_document}`} target="_blank" rel="noopener noreferrer">
                      View user license document
                    </a>
                    <a className="text-blue-700 hover:underline block" href={`/uploads/${editingUser.license_document}`} download>
                      Download
                    </a>
                  </div>
                )}
                {editingUser?.plate_document && (
                  <div className="flex gap-2">
                    <a className="text-emerald-700 hover:underline block" href={`/uploads/${editingUser.plate_document}`} target="_blank" rel="noopener noreferrer">
                      View user plate document
                    </a>
                    <a className="text-blue-700 hover:underline block" href={`/uploads/${editingUser.plate_document}`} download>
                      Download
                    </a>
                  </div>
                )}
                {editingUserLatestLicenseReq?.training_document && (
                  <div className="flex gap-2">
                    <a className="text-emerald-700 hover:underline block" href={`/uploads/${editingUserLatestLicenseReq.training_document}`} target="_blank" rel="noopener noreferrer">
                      View training certificate
                    </a>
                    <a className="text-blue-700 hover:underline block" href={`/uploads/${editingUserLatestLicenseReq.training_document}`} download>
                      Download
                    </a>
                  </div>
                )}
                {editingUserLatestLicenseReq?.coc_document && (
                  <div className="flex gap-2">
                    <a className="text-emerald-700 hover:underline block" href={`/uploads/${editingUserLatestLicenseReq.coc_document}`} target="_blank" rel="noopener noreferrer">
                      View COC result
                    </a>
                    <a className="text-blue-700 hover:underline block" href={`/uploads/${editingUserLatestLicenseReq.coc_document}`} download>
                      Download
                    </a>
                  </div>
                )}
                {!editingUser?.license_document &&
                  !editingUser?.plate_document &&
                  !editingUserLatestLicenseReq?.training_document &&
                  !editingUserLatestLicenseReq?.coc_document && (
                    <p className="text-gray-500">No uploaded documents found for this user.</p>
                  )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button disabled={loading} onClick={saveAdminUser} className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-50">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={cancelEditAdminUser} className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}

        {adminTab === 'administration' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Invite User / Admin</h3>
              <form onSubmit={sendInvite} className="space-y-3">
                <input className="w-full px-4 py-3 rounded-xl border border-gray-200" placeholder="Full Name" value={inviteForm.full_name} onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })} />
                <input required type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200" placeholder="Invite Email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} />
                <select className="w-full px-4 py-3 rounded-xl border border-gray-200" value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}>
                  <option value="user">Invite as User</option>
                  <option value="admin">Invite as Admin</option>
                </select>
                <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50">
                  {loading ? 'Sending...' : 'Send Invite Link'}
                </button>
              </form>

              <div className="mt-6">
                <h4 className="font-bold text-gray-900 mb-2">Recent Invites</h4>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {adminInvites.slice(0, 10).map((inv) => (
                    <div key={inv.id} className="border border-gray-100 rounded-lg p-2 text-sm">
                      <p className="font-semibold text-gray-900">{inv.invited_email} ({inv.role})</p>
                      <p className="text-xs text-gray-600">Status: {inv.status} | {new Date(inv.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                  {adminInvites.length === 0 && <p className="text-sm text-gray-500">No invites yet.</p>}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Admins</h3>
              <div className="space-y-2 max-h-[480px] overflow-y-auto">
                {adminAccounts.map((a) => (
                  <div key={a.id} className="border border-gray-100 rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">{a.full_name}</p>
                      <p className="text-xs text-gray-600">{a.email} | {a.phone_number}</p>
                    </div>
                    {user?.id !== a.id && (
                      <button onClick={() => removeAdmin(a.id)} className="text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">
                        Remove Admin
                      </button>
                    )}
                  </div>
                ))}
                {adminAccounts.length === 0 && <p className="text-sm text-gray-500">No admin accounts found.</p>}
              </div>
            </div>
          </div>
        )}

        {adminTab === 'administration' && (
        <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Profile Change Requests</h3>
            {adminProfileRequests.length === 0 ? <p className="text-sm text-gray-500">No requests.</p> : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {adminProfileRequests.map((r) => (
                  <div key={r.id} className="border border-gray-100 rounded-lg p-3">
                    <p className="text-sm font-semibold text-gray-900">User #{r.user_id} - {new Date(r.created_at).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-600 mt-1">Name: {r.current_full_name} to {r.requested_full_name || r.current_full_name}</p>
                    <p className="text-xs text-gray-600">National ID: {r.current_national_id} to {r.requested_national_id || r.current_national_id}</p>
                    <p className="text-xs text-gray-600">License: {r.current_license_number || '-'} to {r.requested_license_number || r.current_license_number || '-'}</p>
                    <div className="mt-2 flex gap-2">
                      <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100">{r.status.toUpperCase()}</span>
                      {r.status === 'pending' && (
                        <>
                          <button onClick={() => updateProfileRequestStatus(r.id, 'approved')} className="text-xs px-2 py-1 rounded bg-emerald-600 text-white">Approve</button>
                          <button onClick={() => updateProfileRequestStatus(r.id, 'rejected')} className="text-xs px-2 py-1 rounded bg-red-600 text-white">Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-3">License Requests</h3>
            {adminLicenseRequests.length === 0 ? <p className="text-sm text-gray-500">No requests.</p> : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {adminLicenseRequests.map((r) => (
                  <div key={r.id} className="border border-gray-100 rounded-lg p-3">
                    <p className="text-sm font-semibold text-gray-900">{r.full_name} ({r.national_id})</p>
                    <p className="text-xs text-gray-600 mt-1">Learned at: {r.where_learned || '-'}</p>
                    <p className="text-xs text-gray-600">Passed exam: {r.passed_exam || '-'} | Score: {r.exam_score || '-'}</p>
                    <div className="text-xs mt-1">
                      {r.training_document && (
                        <span className="mr-3">
                          <a className="text-emerald-600 hover:underline mr-1" href={`/uploads/${r.training_document}`} target="_blank" rel="noopener noreferrer">Training Doc</a>
                          <a className="text-blue-600 hover:underline" href={`/uploads/${r.training_document}`} download>Download</a>
                        </span>
                      )}
                      {r.coc_document && (
                        <span>
                          <a className="text-emerald-600 hover:underline mr-1" href={`/uploads/${r.coc_document}`} target="_blank" rel="noopener noreferrer">COC Result</a>
                          <a className="text-blue-600 hover:underline" href={`/uploads/${r.coc_document}`} download>Download</a>
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100">{r.status.toUpperCase()}</span>
                      {r.status === 'pending' && (
                        <>
                          <button onClick={() => updateLicenseRequestStatus(r.id, 'approved')} className="text-xs px-2 py-1 rounded bg-emerald-600 text-white">Approve</button>
                          <button onClick={() => updateLicenseRequestStatus(r.id, 'rejected')} className="text-xs px-2 py-1 rounded bg-red-600 text-white">Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Nav />
      
      <main>
        <AnimatePresence mode="wait">
          {view === 'home' && <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{Home()}</motion.div>}
          {view === 'register' && <motion.div key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{Register()}</motion.div>}
          {view === 'admin_invite_register' && <motion.div key="admin_invite_register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{AdminInviteRegister()}</motion.div>}
          {view === 'login' && <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{Login()}</motion.div>}
          {view === 'forgot_password' && <motion.div key="forgot_password" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{ForgotPassword()}</motion.div>}
          {view === 'search' && <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{SearchLicense()}</motion.div>}
          {view === 'contact' && <motion.div key="contact" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{Contact()}</motion.div>}
          {view === 'dashboard' && <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{Dashboard()}</motion.div>}
          {view === 'profile' && <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{Profile()}</motion.div>}
          {view === 'request_license' && <motion.div key="request_license" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{RequestLicense()}</motion.div>}
          {view === 'update' && <motion.div key="update" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{UpdateLicense()}</motion.div>}
          {view === 'payment' && <motion.div key="payment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{Payment()}</motion.div>}
          {view === 'confirmation' && <motion.div key="confirmation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{Confirmation()}</motion.div>}
          {view === 'admin' && <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{Admin()}</motion.div>}
        </AnimatePresence>
      </main>

      <footer className="bg-white border-t border-gray-100 mt-24 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
              <span className="ml-2 text-lg font-bold text-gray-900">Hossana DL Office</span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-500">
              <button className="hover:text-emerald-600">Privacy Policy</button>
              <button className="hover:text-emerald-600">Terms of Service</button>
              <button onClick={() => setView('contact')} className="hover:text-emerald-600">Contact Us</button>
            </div>
            <p className="mt-4 md:mt-0 text-sm text-gray-400">© 2026 Hossana City Administration. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
