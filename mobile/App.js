import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Button, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import axios from 'axios';

// ⚠️ STEP 1: PASTE YOUR BACKEND URL HERE (Remove any trailing slash '/')
// Example: 'https://humble-guacamole-7vp7rg4w56rw2pxrw-8000.app.github.dev'
const API_URL = 'https://humble-guacamole-7vp7rg4w56rw2pxrw-8000.app.github.dev'; 

const POLICE_SECRET = "POLICE_ACCESS_TOKEN_2026";

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [scanData, setScanData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getBarCodeScannerPermissions();
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);
    setLoading(true);

    try {
      // 🔒 THE DOUBLE-LOCK HANDSHAKE
      console.log("Scanning Token:", data); // Debug log
      const response = await axios.post(
        `${API_URL}/verify_qr`,
        { token: data }, 
        { headers: { 'x-police-auth': POLICE_SECRET } }
      );

      setScanData(response.data);
    } catch (error) {
      console.error("Scan Error:", error);
      if (error.response && error.response.status === 403) {
        // Use window.alert for Web, Alert.alert for Mobile
        if (Platform.OS === 'web') {
           alert("🚨 SECURITY ALERT: Unauthorized Device Detected!");
        } else {
           Alert.alert("🚨 SECURITY ALERT", "Unauthorized Device Detected!");
        }
      } else {
        if (Platform.OS === 'web') {
           alert("⚠️ INVALID PASS: Fake or Expired.");
        } else {
           Alert.alert("⚠️ INVALID PASS", "This QR Code is Fake or Expired.");
        }
      }
      setScanData(null);
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) return <Text style={{color:'#fff'}}>Requesting camera permission...</Text>;
  if (hasPermission === false) return <Text style={{color:'#fff'}}>No access to camera</Text>;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>NEXUS ENFORCER</Text>
        <Text style={styles.headerSub}>👮 POLICE USE ONLY</Text>
      </View>

      {/* CAMERA VIEWFINDER */}
      {!scanData ? (
        <View style={styles.cameraContainer}>
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.overlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanText}>ALIGN QR CODE WITHIN FRAME</Text>
          </View>
          {loading && <ActivityIndicator size="large" color="#FF6600" style={styles.loader} />}
        </View>
      ) : (
        // VERIFIED RESULT SCREEN
        <View style={styles.resultCard}>
          <Text style={styles.statusApproved}>✅ VERIFIED LEGAL</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>DRIVER:</Text>
            <Text style={styles.value}>{scanData.driver}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>VEHICLE:</Text>
            <Text style={styles.value}>{scanData.vehicle}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>ROUTE:</Text>
            <Text style={styles.value}>{scanData.route}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>TRUST SCORE:</Text>
            <Text style={{color: '#0f0', fontWeight: 'bold'}}>100% (Green Channel)</Text>
          </View>
          
          <TouchableOpacity onPress={() => { setScanned(false); setScanData(null); }} style={styles.scanBtn}>
            <Text style={styles.btnText}>SCAN NEXT TRUCK</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* RE-SCAN BUTTON */}
      {scanned && !scanData && !loading && (
         <Button title="Tap to Scan Again" color="#FF6600" onPress={() => setScanned(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 20, alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900', fontStyle: 'italic' },
  headerSub: { color: '#FF6600', fontSize: 12, letterSpacing: 2, marginTop: 5 },
  cameraContainer: { width: 300, height: 300, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#333', position: 'relative' },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 200, height: 200, borderWidth: 2, borderColor: '#FF6600', backgroundColor: 'transparent' },
  scanText: { color: 'white', marginTop: 20, fontSize: 10, opacity: 0.7, backgroundColor: 'rgba(0,0,0,0.5)', padding: 4 },
  loader: { position: 'absolute', top: '45%', left: '45%' },
  resultCard: { width: 320, backgroundColor: '#111', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#0f0' },
  statusApproved: { color: '#0f0', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#222', paddingBottom: 5 },
  label: { color: '#666', fontSize: 12 },
  value: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  scanBtn: { backgroundColor: '#FF6600', padding: 15, borderRadius: 10, marginTop: 10 },
  btnText: { color: 'white', textAlign: 'center', fontWeight: 'bold' }
});