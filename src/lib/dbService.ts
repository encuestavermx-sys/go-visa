import {
  auth,
  db,
  storage,
  isFirebaseConfigured,
} from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { calculateVisaScore } from "./scoreCalculator";

// --- MOCK DATABASE DEFINITIONS ---
const INITIAL_WAIT_TIMES = [
  { id: "cdmx", city: "Ciudad de México", casWaitDays: 5, interviewWaitDays: 450 },
  { id: "gdl", city: "Guadalajara", casWaitDays: 7, interviewWaitDays: 420 },
  { id: "mty", city: "Monterrey", casWaitDays: 4, interviewWaitDays: 390 },
  { id: "tij", city: "Tijuana", casWaitDays: 2, interviewWaitDays: 310 },
  { id: "cdj", city: "Ciudad Juárez", casWaitDays: 2, interviewWaitDays: 350 },
  { id: "her", city: "Hermosillo", casWaitDays: 3, interviewWaitDays: 280 },
  { id: "mer", city: "Mérida", casWaitDays: 6, interviewWaitDays: 320 },
  { id: "mat", city: "Matamoros", casWaitDays: 3, interviewWaitDays: 290 },
  { id: "nld", city: "Nuevo Laredo", casWaitDays: 4, interviewWaitDays: 300 },
  { id: "nog", city: "Nogales", casWaitDays: 2, interviewWaitDays: 270 },
];

const INITIAL_APPLICATIONS = [
  {
    id: "app-1",
    userId: "user-1",
    userEmail: "carlos@example.com",
    userName: "Carlos Méndez",
    status: "En revisión",
    step: 5,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    formData: {
      firstName: "Carlos",
      lastName: "Méndez",
      birthDate: "1988-06-15",
      gender: "male",
      maritalStatus: "married",
      nationality: "mexicana",
      phone: "5551234567",
      email: "carlos@example.com",
      address: "Reforma 456, CDMX",
      occupation: "Ingeniero de Software",
      monthlyIncome: "45000",
      employmentYears: "4",
      passportNumber: "MX123456",
      passportIssueDate: "2022-01-10",
      passportExpiryDate: "2032-01-10",
      passportCity: "Ciudad de México",
      travelPurpose: "Tourism",
      travelFundedBy: "self",
      hasTravelHistory: "yes",
      traveledCountries: "España, Francia",
      hasFamilyInUS: "no",
      hasVisaDenials: "no",
    },
    visaScore: null, // Will calculate
    adminNotes: "Solicitud completa. El perfil se ve sólido, con buenos ingresos e historial de viaje.",
    appointment: {
      location: "cdmx",
      casDate: "2026-08-10",
      casTime: "09:30",
      interviewDate: "2026-08-12",
      interviewTime: "10:15",
      status: "Pendiente de confirmación",
    },
  },
  {
    id: "app-2",
    userId: "user-2",
    userEmail: "ana@example.com",
    userName: "Ana López",
    status: "Nuevo",
    step: 1,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    formData: {
      firstName: "Ana",
      lastName: "López",
      email: "ana@example.com",
      phone: "8181234567",
      occupation: "ama de casa",
      monthlyIncome: "0",
      employmentYears: "0",
      travelFundedBy: "cónyuge",
      hasTravelHistory: "no",
      hasFamilyInUS: "yes",
      familyStatusInUS: "citizen",
    },
    visaScore: null,
    adminNotes: "Acaba de registrarse. Pendiente de completar DS-160.",
  },
];

const INITIAL_DOCUMENTS = [
  {
    id: "doc-1",
    userId: "user-1",
    docType: "Pasaporte",
    fileName: "Pasaporte_Carlos.pdf",
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    status: "Aprobado",
    feedback: "",
    updatedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: "doc-2",
    userId: "user-1",
    docType: "Comprobante de Ingresos",
    fileName: "Nomina_Ultimos3Meses.pdf",
    fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    status: "Pendiente",
    feedback: "",
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

const INITIAL_MESSAGES = [
  { id: "msg-1", applicationId: "app-1", senderId: "user-1", senderName: "Carlos Méndez", text: "Hola, acabo de subir mis recibos de nómina. ¿Podrían revisarlos?", timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: "msg-2", applicationId: "app-1", senderId: "admin", senderName: "Administrador", text: "Hola Carlos, claro que sí. En un momento los validamos.", timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString() },
  { id: "msg-3", applicationId: "app-1", senderId: "user-1", senderName: "Carlos Méndez", text: "Excelente, ¡muchas gracias!", timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString() },
];

// Helper to seed localStorage
const getLocalStorageData = (key: string, initialData: any) => {
  if (typeof window === "undefined") return initialData;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(data);
};

const setLocalStorageData = (key: string, data: any) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

// --- AUTH SERVICE ---
export const authService = {
  login: async (email: string, password: string) => {
    if (isFirebaseConfigured) {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      // Fetch role from firestore
      const userDoc = await getDoc(doc(db, "users", credential.user.uid));
      const role = userDoc.exists() ? userDoc.data().role : "user";
      const displayName = userDoc.exists() ? userDoc.data().displayName : credential.user.displayName;
      return { uid: credential.user.uid, email: credential.user.email, role, displayName };
    } else {
      // Mock Auth
      const users = getLocalStorageData("go-visa_users", [
        { uid: "admin-1", email: "admin@govisa.mx", role: "admin", displayName: "Admin Go-Visa" },
        { uid: "user-1", email: "carlos@example.com", role: "user", displayName: "Carlos Méndez" },
        { uid: "user-2", email: "ana@example.com", role: "user", displayName: "Ana López" },
      ]);
      const found = users.find((u: any) => u.email === email);
      if (!found) throw new Error("Usuario no encontrado.");
      // In mock, any password works for demonstration!
      return found;
    }
  },

  register: async (email: string, password: string, displayName: string, role = "user", score?: number) => {
    if (isFirebaseConfigured) {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const userData = { uid: credential.user.uid, email, displayName, role, createdAt: new Date().toISOString() };
      await setDoc(doc(db, "users", credential.user.uid), userData);
      
      // Auto create application for user
      const appRef = doc(db, "applications", credential.user.uid);
      await setDoc(appRef, {
        id: credential.user.uid,
        userId: credential.user.uid,
        userEmail: email,
        userName: displayName,
        status: "Nuevo",
        step: 1,
        formData: { firstName: displayName.split(" ")[0], email },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        visaScore: score ? {
          score,
          level: score >= 88 ? "Fuerte" : score >= 76 ? "Favorable" : "Medio",
          recommendations: score >= 88 
            ? ["Tu perfil inicial es muy sólido. Mantén tus documentos de soporte listos."]
            : ["Tu perfil inicial es favorable con soporte. Nuestro equipo te asesorará para fortalecer tus lazos."],
          risks: []
        } : null
      });

      return userData;
    } else {
      // Mock Register
      const users = getLocalStorageData("go-visa_users", [
        { uid: "admin-1", email: "admin@govisa.mx", role: "admin", displayName: "Admin Go-Visa" },
        { uid: "user-1", email: "carlos@example.com", role: "user", displayName: "Carlos Méndez" },
        { uid: "user-2", email: "ana@example.com", role: "user", displayName: "Ana López" },
      ]);
      
      if (users.find((u: any) => u.email === email)) throw new Error("El correo ya está registrado.");
      
      const newUid = `user-${Date.now()}`;
      const newUser = { uid: newUid, email, role, displayName };
      users.push(newUser);
      setLocalStorageData("go-visa_users", users);
 
      // Create application
      const apps = getLocalStorageData("go-visa_applications", INITIAL_APPLICATIONS);
      const newApp = {
        id: `app-${newUid}`,
        userId: newUid,
        userEmail: email,
        userName: displayName,
        status: "Nuevo",
        step: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        formData: {
          firstName: displayName.split(" ")[0] || "",
          lastName: displayName.split(" ").slice(1).join(" ") || "",
          email: email
        },
        visaScore: score ? {
          score,
          level: score >= 88 ? "Fuerte" : score >= 76 ? "Favorable" : "Medio",
          recommendations: score >= 88 
            ? ["Tu perfil inicial es muy sólido. Mantén tus documentos de soporte listos."]
            : ["Tu perfil inicial es favorable con soporte. Nuestro equipo te asesorará para fortalecer tus lazos."],
          risks: []
        } : null,
      };
      apps.push(newApp);
      setLocalStorageData("go-visa_applications", apps);
 
      return newUser;
    }
  },

  loginWithGoogle: async () => {
    // Real Google OAuth popup - works when Google is enabled in Firebase Console
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;

    // Upsert user doc in Firestore
    const userRef = doc(db, "users", fbUser.uid);
    const userSnap = await getDoc(userRef);
    let role = "user";
    let displayName = fbUser.displayName || fbUser.email?.split("@")[0] || "Usuario";

    if (!userSnap.exists()) {
      const userData = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName,
        role,
        createdAt: new Date().toISOString(),
      };
      await setDoc(userRef, userData);

      // Create their application
      const appRef = doc(db, "applications", fbUser.uid);
      await setDoc(appRef, {
        id: fbUser.uid,
        userId: fbUser.uid,
        userEmail: fbUser.email,
        userName: displayName,
        status: "Nuevo",
        step: 1,
        formData: { firstName: displayName.split(" ")[0], email: fbUser.email },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        visaScore: null,
      });
    } else {
      role = userSnap.data().role || "user";
      displayName = userSnap.data().displayName || displayName;
    }

    return { uid: fbUser.uid, email: fbUser.email, role, displayName };
  },

  logout: async () => {
    if (isFirebaseConfigured) {
      await signOut(auth);
    }
  },

  getCurrentUser: () => {
    if (isFirebaseConfigured) {
      const user = auth.currentUser;
      return user ? { uid: user.uid, email: user.email, displayName: user.displayName } : null;
    } else {
      if (typeof window !== "undefined") {
        const session = localStorage.getItem("go-visa_session");
        return session ? JSON.parse(session) : null;
      }
      return null;
    }
  },

  onAuthChange: (callback: (user: any) => void) => {
    if (isFirebaseConfigured) {
      return onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          // get additional profile
          const userDoc = await getDoc(doc(db, "users", fbUser.uid));
          const role = userDoc.exists() ? userDoc.data().role : "user";
          const displayName = userDoc.exists() ? userDoc.data().displayName : fbUser.displayName;
          callback({ uid: fbUser.uid, email: fbUser.email, role, displayName });
        } else {
          callback(null);
        }
      });
    } else {
      // For local storage, triggers instantly
      if (typeof window !== "undefined") {
        const session = localStorage.getItem("go-visa_session");
        callback(session ? JSON.parse(session) : null);
      }
      return () => {}; // return empty unsubscribe
    }
  }
};

// --- APPLICATION SERVICE ---
export const applicationService = {
  getApplication: async (userId: string) => {
    if (isFirebaseConfigured) {
      const docRef = doc(db, "applications", userId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        // Calculate visa score dynamically if there is form data
        if (data.formData) {
          data.visaScore = calculateVisaScore(data.formData);
        }
        return data;
      }
      return null;
    } else {
      const apps = getLocalStorageData("go-visa_applications", INITIAL_APPLICATIONS);
      const app = apps.find((a: any) => a.userId === userId);
      if (app && app.formData) {
        app.visaScore = calculateVisaScore(app.formData);
      }
      return app || null;
    }
  },

  saveApplication: async (userId: string, step: number, formData: any) => {
    const visaScore = calculateVisaScore(formData);
    const updatePayload = {
      step,
      formData,
      visaScore,
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured) {
      const docRef = doc(db, "applications", userId);
      await updateDoc(docRef, updatePayload);
      return { userId, ...updatePayload };
    } else {
      const apps = getLocalStorageData("go-visa_applications", INITIAL_APPLICATIONS);
      const index = apps.findIndex((a: any) => a.userId === userId);
      if (index !== -1) {
        apps[index] = { ...apps[index], ...updatePayload };
        setLocalStorageData("go-visa_applications", apps);
        return apps[index];
      }
      return null;
    }
  },

  updateStatus: async (applicationId: string, status: string) => {
    if (isFirebaseConfigured) {
      const docRef = doc(db, "applications", applicationId);
      await updateDoc(docRef, { status, updatedAt: new Date().toISOString() });
    } else {
      const apps = getLocalStorageData("go-visa_applications", INITIAL_APPLICATIONS);
      const index = apps.findIndex((a: any) => a.id === applicationId || a.userId === applicationId);
      if (index !== -1) {
        apps[index].status = status;
        apps[index].updatedAt = new Date().toISOString();
        setLocalStorageData("go-visa_applications", apps);
      }
    }
  },

  updateAdminNotes: async (applicationId: string, adminNotes: string) => {
    if (isFirebaseConfigured) {
      const docRef = doc(db, "applications", applicationId);
      await updateDoc(docRef, { adminNotes, updatedAt: new Date().toISOString() });
    } else {
      const apps = getLocalStorageData("go-visa_applications", INITIAL_APPLICATIONS);
      const index = apps.findIndex((a: any) => a.id === applicationId || a.userId === applicationId);
      if (index !== -1) {
        apps[index].adminNotes = adminNotes;
        apps[index].updatedAt = new Date().toISOString();
        setLocalStorageData("go-visa_applications", apps);
      }
    }
  },

  assignAppointment: async (applicationId: string, appointment: any) => {
    if (isFirebaseConfigured) {
      const docRef = doc(db, "applications", applicationId);
      await updateDoc(docRef, { appointment, updatedAt: new Date().toISOString() });
    } else {
      const apps = getLocalStorageData("go-visa_applications", INITIAL_APPLICATIONS);
      const index = apps.findIndex((a: any) => a.id === applicationId || a.userId === applicationId);
      if (index !== -1) {
        apps[index].appointment = appointment;
        apps[index].updatedAt = new Date().toISOString();
        setLocalStorageData("go-visa_applications", apps);
      }
    }
  },

  adminUpdateApplication: async (applicationId: string, updateData: any) => {
    if (isFirebaseConfigured) {
      const docRef = doc(db, "applications", applicationId);
      await updateDoc(docRef, { ...updateData, updatedAt: new Date().toISOString() });
    } else {
      const apps = getLocalStorageData("go-visa_applications", INITIAL_APPLICATIONS);
      const index = apps.findIndex((a: any) => a.id === applicationId || a.userId === applicationId);
      if (index !== -1) {
        apps[index] = { ...apps[index], ...updateData, updatedAt: new Date().toISOString() };
        setLocalStorageData("go-visa_applications", apps);
      }
    }
  },

  getAllApplications: async () => {
    if (isFirebaseConfigured) {
      const querySnapshot = await getDocs(collection(db, "applications"));
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.formData) {
          data.visaScore = calculateVisaScore(data.formData);
        }
        list.push({ id: doc.id, ...data });
      });
      return list;
    } else {
      const apps = getLocalStorageData("go-visa_applications", INITIAL_APPLICATIONS);
      return apps.map((a: any) => {
        if (a.formData) {
          a.visaScore = calculateVisaScore(a.formData);
        }
        return a;
      });
    }
  }
};

// --- DOCUMENT SERVICE ---
export const documentService = {
  getDocuments: async (userId: string) => {
    if (isFirebaseConfigured) {
      const q = query(collection(db, "documents"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      return list;
    } else {
      const docs = getLocalStorageData("go-visa_documents", INITIAL_DOCUMENTS);
      return docs.filter((d: any) => d.userId === userId);
    }
  },

  uploadDocument: async (userId: string, docType: string, file: File) => {
    const fileName = file.name;
    const updatedAt = new Date().toISOString();

    if (isFirebaseConfigured) {
      const fileRef = ref(storage, `documents/${userId}/${Date.now()}_${fileName}`);
      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);

      const docId = `${userId}_${docType.replace(/\s+/g, "_")}`;
      const docData = {
        id: docId,
        userId,
        docType,
        fileName,
        fileUrl,
        status: "Pendiente",
        feedback: "",
        updatedAt,
      };

      await setDoc(doc(db, "documents", docId), docData);
      return docData;
    } else {
      // Mock File Upload (Convert to local file blob url or keep simulated url)
      const fileUrl = URL.createObjectURL(file);
      const docs = getLocalStorageData("go-visa_documents", INITIAL_DOCUMENTS);
      
      const docId = `doc-${userId}-${docType.replace(/\s+/g, "_")}-${Date.now()}`;
      const newDoc = {
        id: docId,
        userId,
        docType,
        fileName,
        fileUrl, // Simulated URL
        status: "Pendiente",
        feedback: "",
        updatedAt,
      };

      // Remove existing doc of same type for user if exists
      const filtered = docs.filter((d: any) => !(d.userId === userId && d.docType === docType));
      filtered.push(newDoc);
      
      setLocalStorageData("go-visa_documents", filtered);
      return newDoc;
    }
  },

  updateDocumentStatus: async (docId: string, status: string, feedback: string) => {
    if (isFirebaseConfigured) {
      const docRef = doc(db, "documents", docId);
      await updateDoc(docRef, { status, feedback, updatedAt: new Date().toISOString() });
    } else {
      const docs = getLocalStorageData("go-visa_documents", INITIAL_DOCUMENTS);
      const index = docs.findIndex((d: any) => d.id === docId);
      if (index !== -1) {
        docs[index].status = status;
        docs[index].feedback = feedback;
        docs[index].updatedAt = new Date().toISOString();
        setLocalStorageData("go-visa_documents", docs);
      }
    }
  }
};

// --- MESSAGE SERVICE ---
export const messageService = {
  getMessages: (applicationId: string, callback: (messages: any[]) => void) => {
    if (isFirebaseConfigured) {
      const q = query(
        collection(db, "messages"),
        where("applicationId", "==", applicationId),
        orderBy("timestamp", "asc")
      );
      return onSnapshot(q, (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        callback(list);
      });
    } else {
      // LocalStorage mock sync
      const getMsgs = () => {
        const msgs = getLocalStorageData("go-visa_messages", INITIAL_MESSAGES);
        return msgs.filter((m: any) => m.applicationId === applicationId);
      };
      
      callback(getMsgs());

      // Simulate a listener by checking localStorage on an interval
      const interval = setInterval(() => {
        callback(getMsgs());
      }, 1000);

      return () => clearInterval(interval); // Return unsubscribe
    }
  },

  onMessages: (applicationId: string, callback: (messages: any[]) => void) => {
    return messageService.getMessages(applicationId, callback);
  },

  sendMessage: async (applicationId: string, senderId: string, text: string, senderName?: string) => {
    const timestamp = new Date().toISOString();
    const finalSenderName = senderName || (senderId === "admin" ? "Administrador" : "Cliente");
    const messagePayload = {
      applicationId,
      senderId,
      senderName: finalSenderName,
      text,
      timestamp,
    };

    if (isFirebaseConfigured) {
      await addDoc(collection(db, "messages"), messagePayload);
    } else {
      const msgs = getLocalStorageData("go-visa_messages", INITIAL_MESSAGES);
      const newMsg = {
        id: `msg-${Date.now()}`,
        ...messagePayload,
      };
      msgs.push(newMsg);
      setLocalStorageData("go-visa_messages", msgs);

      // Auto-reply simulation from admin if user sent message (for validation/SaaS premium look)
      if (senderId !== "admin") {
        setTimeout(() => {
          const msgsLater = getLocalStorageData("go-visa_messages", INITIAL_MESSAGES);
          const reply = {
            id: `msg-reply-${Date.now()}`,
            applicationId,
            senderId: "admin",
            senderName: "Asesor Go-Visa",
            text: "¡Hola! He recibido tu mensaje. Revisaremos tu solicitud a la brevedad y te daremos respuesta por aquí o por WhatsApp. Gracias.",
            timestamp: new Date().toISOString(),
          };
          msgsLater.push(reply);
          setLocalStorageData("go-visa_messages", msgsLater);
        }, 3000);
      }
    }
  }
};

// --- WAIT TIME SERVICE ---
export const waitTimeService = {
  getWaitTimes: async () => {
    if (isFirebaseConfigured) {
      const querySnapshot = await getDocs(collection(db, "wait_times"));
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Fallback to initial if firestore is empty
      if (list.length === 0) {
        try {
          for (const item of INITIAL_WAIT_TIMES) {
            await setDoc(doc(db, "wait_times", item.id), item);
          }
        } catch (error) {
          console.warn("Could not seed wait_times to Firestore (normal if not admin):", error);
        }
        return INITIAL_WAIT_TIMES;
      }
      return list;
    } else {
      return getLocalStorageData("go-visa_wait_times", INITIAL_WAIT_TIMES);
    }
  },

  updateWaitTime: async (cityId: string, casWaitDays: number, interviewWaitDays: number) => {
    if (isFirebaseConfigured) {
      const docRef = doc(db, "wait_times", cityId);
      await updateDoc(docRef, { casWaitDays, interviewWaitDays });
    } else {
      const list = getLocalStorageData("go-visa_wait_times", INITIAL_WAIT_TIMES);
      const index = list.findIndex((w: any) => w.id === cityId);
      if (index !== -1) {
        list[index].casWaitDays = casWaitDays;
        list[index].interviewWaitDays = interviewWaitDays;
        setLocalStorageData("go-visa_wait_times", list);
      }
    }
  }
};
