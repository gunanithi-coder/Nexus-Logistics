import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, Vibration, ScrollView, Image, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';

// ⚠️ YOUR BACKEND URL
const API_URL = 'https://humble-guacamole-7vp7rg4w56rw2pxrw-8000.app.github.dev';
const POLICE_SECRET = "POLICE_ACCESS_TOKEN_2026";

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanData, setScanData] = useState(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (!permission) requestPermission();
  }, []);

  if (!permission || !permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'white', marginBottom: 20 }}>Camera Access Required</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.btnPrimary}>
          <Text style={styles.btnText}>GRANT ACCESS</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    setLoading(true);
    Vibration.vibrate(); 

    try {
      const response = await axios.post(
        `${API_URL}/verify_qr`, 
        { token: data }, 
        { headers: { 'x-police-auth': POLICE_SECRET } }
      );

      setLoading(false);
      setAiAnalyzing(true);
      
      setTimeout(() => {
        setAiAnalyzing(false);
        setScanData(response.data);
      }, 2000); 

    } catch (error) {
      setLoading(false);
      Alert.alert("🚨 SECURITY ALERT", "FAKE OR EXPIRED PASS DETECTED!");
      setScanned(false);
    } 
  };

  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <MaterialIcons name="security" size={24} color="#FF6600" />
        <View>
          <Text style={styles.headerTitle}>NEXUS ENFORCER</Text>
          <Text style={styles.headerSub}>GOVT. LOGISTICS GRID • LIVE</Text>
        </View>
        <View style={styles.liveBadge}><View style={styles.dot} /></View>
      </View>

      {/* CAMERA */}
      {!scanData && !aiAnalyzing && (
        <View style={styles.camContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          />
          <View style={styles.overlay}>
             <View style={styles.cornerTL} />
             <View style={styles.cornerTR} />
             <View style={styles.cornerBL} />
             <View style={styles.cornerBR} />
             <Text style={styles.scanText}>SEARCHING FOR QR SIGNATURE...</Text>
          </View>
        </View>
      )}

      {/* AI LOADING */}
      {aiAnalyzing && (
        <View style={styles.aiScreen}>
           <ActivityIndicator size="large" color="#00ff00" />
           <Text style={styles.aiText}>CONNECTING TO SATELLITE...</Text>
           <Text style={styles.aiSubText}>Downloading Digital Documents...</Text>
        </View>
      )}

      {/* RESULTS */}
      {scanData && (
        <ScrollView style={styles.resultScroll}>
           <View style={styles.statusBanner}>
              <FontAwesome5 name="check-circle" size={40} color="#22c55e" />
              <Text style={styles.verifiedText}>VERIFIED LEGAL</Text>
              <Text style={styles.timestamp}>Scanned: {new Date().toLocaleTimeString()}</Text>
           </View>

           <View style={styles.card}>
              <Text style={styles.cardLabel}>DRIVER PROFILE</Text>
              <View style={styles.row}>
                 <FontAwesome5 name="user-alt" size={20} color="#888" />
                 <Text style={styles.cardValue}>{scanData.driver}</Text>
              </View>
              <View style={styles.row}>
                 <FontAwesome5 name="truck" size={20} color="#FF6600" />
                 <Text style={styles.cardValue}>{scanData.vehicle}</Text>
              </View>
           </View>

           {/* ✅ NEW: DIGITAL DOCUMENTS SECTION */}
           <View style={styles.card}>
              <Text style={styles.cardLabel}>DIGITAL COMPLIANCE DOCS</Text>
              {scanData.documents.map((doc, index) => (
                 <View key={index} style={styles.docRow}>
                    <View>
                        <Text style={styles.docName}>{doc.name}</Text>
                        <Text style={{color: '#22c55e', fontSize: 10}}>● {doc.status}</Text>
                    </View>
                    {/* VIEW BUTTON - Only shows if image exists */}
                    {doc.image ? (
                        <TouchableOpacity style={styles.viewBtn} onPress={() => setSelectedImage(doc.image)}>
                            <Ionicons name="eye" size={16} color="white" />
                            <Text style={styles.viewBtnText}>VIEW PROOF</Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={{color: '#555', fontSize: 10}}>NO IMAGE</Text>
                    )}
                 </View>
              ))}
           </View>

           <TouchableOpacity style={styles.scanBtn} onPress={() => { setScanned(false); setScanData(null); }}>
              <Text style={styles.btnText}>SCAN NEXT VEHICLE</Text>
           </TouchableOpacity>
           <View style={{height: 50}} /> 
        </ScrollView>
      )}

      {/* EVIDENCE MODAL */}
      <Modal visible={!!selectedImage} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedImage(null)}>
                <Ionicons name="close-circle" size={40} color="white" />
            </TouchableOpacity>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>OFFICIAL DOCUMENT RECORD</Text>
                {selectedImage && (
                    <Image source={{ uri: selectedImage }} style={styles.evidenceImage} resizeMode="contain" />
                )}
            </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505', paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#333' },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginLeft: 10 },
  headerSub: { color: '#888', fontSize: 10, marginLeft: 10, letterSpacing: 1 },
  liveBadge: { marginLeft: 'auto', width: 10, height: 10, borderRadius: 5, backgroundColor: 'red' },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'red' },
  camContainer: { flex: 1, margin: 20, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#444' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scanText: { color: 'white', marginTop: 250, backgroundColor: 'rgba(0,0,0,0.6)', padding: 5, fontSize: 12 },
  cornerTL: { position: 'absolute', top: 50, left: 50, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#FF6600' },
  cornerTR: { position: 'absolute', top: 50, right: 50, width: 40, height: 40, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#FF6600' },
  cornerBL: { position: 'absolute', bottom: 50, left: 50, width: 40, height: 40, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#FF6600' },
  cornerBR: { position: 'absolute', bottom: 50, right: 50, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#FF6600' },
  aiScreen: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  aiText: { color: '#00ff00', marginTop: 20, fontSize: 18, fontWeight: 'bold', letterSpacing: 2 },
  aiSubText: { color: '#555', marginTop: 5, fontSize: 12 },
  resultScroll: { flex: 1, padding: 20 },
  statusBanner: { alignItems: 'center', marginBottom: 20, padding: 20, backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 15, borderWidth: 1, borderColor: '#22c55e' },
  verifiedText: { color: '#22c55e', fontSize: 24, fontWeight: '900', marginTop: 10, letterSpacing: 1 },
  timestamp: { color: '#666', fontSize: 12, marginTop: 5 },
  card: { backgroundColor: '#111', padding: 20, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: '#222' },
  cardLabel: { color: '#555', fontSize: 10, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  cardValue: { color: 'white', fontSize: 18, marginLeft: 15, fontWeight: '500' },
  docRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#222' },
  docName: { color: '#ccc', fontWeight: 'bold' },
  viewBtn: { flexDirection: 'row', backgroundColor: '#333', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, alignItems: 'center', gap: 5 },
  viewBtnText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  scanBtn: { backgroundColor: '#FF6600', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  btnPrimary: { backgroundColor: '#FF6600', padding: 15, borderRadius: 8 },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 50, right: 30, zIndex: 10 },
  modalContent: { width: '90%', height: '70%', alignItems: 'center' },
  modalTitle: { color: '#FF6600', fontSize: 18, fontWeight: 'bold', marginBottom: 20, letterSpacing: 2 },
  evidenceImage: { width: '100%', height: '100%', borderRadius: 10, borderWidth: 1, borderColor: '#333' }
});