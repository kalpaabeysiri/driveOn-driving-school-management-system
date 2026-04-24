import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, TextInput, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { getSessions, createPayment } from '../../services/api';
import { getAllStudents, getStudentById } from '../../services/studentApi';
import { useAuth } from '../../context/AuthContext';
import { COLORS } from '../../theme';

const ADMIN_METHODS = ['Cash', 'Card', 'Bank Transfer'];

export default function AddPaymentScreen({ navigation, route }) {
  const { user } = useAuth();

  const isStudentEnd =
    route?.params?.isStudentEnd === true ||
    route?.params?.isStudentView === true ||
    user?.role === 'student';

  const loggedStudentId =
    route?.params?.studentId ||
    user?._id ||
    user?.id ||
    user?.studentId;

  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [student, setStudent] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(isStudentEnd ? 'Bank Transfer' : 'Cash');
  const [sessionId, setSessionId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [reference, setReference] = useState('');
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isStudentEnd) {
          const studentRes = await getStudentById(loggedStudentId);
          const studentData = studentRes.data;

          setStudent(studentData);
          setStudentId(studentData?._id || loggedStudentId);
          setMethod('Bank Transfer');
        } else {
          const [sessRes, stuRes] = await Promise.all([
            getSessions(),
            getAllStudents(),
          ]);

          setSessions(
            sessRes.data.filter(
              s => s.status === 'Scheduled' || s.status === 'Completed'
            )
          );

          setStudents(stuRes.data || []);
        }
      } catch (error) {
        console.log('Could not load data:', error.message);
        Alert.alert('Error', 'Could not load payment details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isStudentEnd, loggedStudentId]);

  const pickReceipt = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      return Alert.alert(
        'Permission needed',
        'Please allow access to your photo library'
      );
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setReceipt(result.assets[0]);
    }
  };

  const generateReceiptHtml = () => {
    const today = new Date().toLocaleString();

    const selectedStudent = students.find(s => s._id === studentId);

    const studentName = student
      ? `${student.firstName || ''} ${student.lastName || ''}`.trim()
      : selectedStudent
        ? `${selectedStudent.firstName || ''} ${selectedStudent.lastName || ''}`.trim()
        : 'N/A';

    const studentEmail = student
      ? student.email
      : selectedStudent?.email || 'N/A';

    const studentNIC = student
      ? student.NIC
      : selectedStudent?.NIC || 'N/A';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 28px;
              color: #222;
            }

            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 14px;
              margin-bottom: 24px;
            }

            .brand {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 4px;
            }

            .title {
              font-size: 20px;
              font-weight: bold;
              margin-top: 20px;
              margin-bottom: 18px;
              text-align: center;
            }

            .section {
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 14px;
              margin-bottom: 16px;
            }

            .section-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
            }

            .row {
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
              border-bottom: 1px solid #f1f1f1;
            }

            .label {
              font-weight: bold;
              color: #555;
            }

            .value {
              color: #111;
            }

            .amount {
              font-size: 20px;
              font-weight: bold;
              color: #0f62fe;
            }

            .note {
              background: #f7f7f7;
              padding: 12px;
              border-radius: 8px;
              font-size: 13px;
              line-height: 20px;
            }

            .footer {
              margin-top: 32px;
              text-align: center;
              font-size: 12px;
              color: #777;
            }
          </style>
        </head>

        <body>
          <div class="header">
            <div class="brand">DriveOn Driving School</div>
            <div>Bank Transfer Payment Receipt</div>
          </div>

          <div class="title">Transaction Receipt</div>

          <div class="section">
            <div class="section-title">Student Details</div>

            <div class="row">
              <span class="label">Student Name</span>
              <span class="value">${studentName || 'N/A'}</span>
            </div>

            <div class="row">
              <span class="label">Email</span>
              <span class="value">${studentEmail || 'N/A'}</span>
            </div>

            <div class="row">
              <span class="label">NIC</span>
              <span class="value">${studentNIC || 'N/A'}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Payment Details</div>

            <div class="row">
              <span class="label">Amount</span>
              <span class="value amount">LKR ${Number(amount || 0).toLocaleString()}</span>
            </div>

            <div class="row">
              <span class="label">Payment Method</span>
              <span class="value">${method}</span>
            </div>

            <div class="row">
              <span class="label">Transaction ID</span>
              <span class="value">${reference || 'N/A'}</span>
            </div>

            <div class="row">
              <span class="label">Submitted Date</span>
              <span class="value">${today}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Bank Account Details</div>

            <div class="note">
              Account Name: DriveOn Driving School<br/>
              Bank: Bank of Ceylon<br/>
              Branch: Colombo<br/>
              Account No: 1234567890<br/>
              Reference: Student NIC / Name
            </div>
          </div>

          <div class="footer">
            This is a system-generated transaction receipt.
          </div>
        </body>
      </html>
    `;
  };

  const handleSaveReceiptPdf = async () => {
    try {
      const html = generateReceiptHtml();

      const file = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const canShare = await Sharing.isAvailableAsync();

      if (!canShare) {
        Alert.alert('Receipt Generated', `PDF file created: ${file.uri}`);
        return;
      }

      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save Transaction Receipt',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      console.log('Receipt PDF error:', error);
      Alert.alert('Error', 'Could not generate transaction receipt PDF');
    }
  };

  const handleSubmit = async () => {
    if (!amount || !method) {
      return Alert.alert('Error', 'Amount and payment method are required');
    }

    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      return Alert.alert('Error', 'Please enter a valid amount');
    }

    if (!isStudentEnd && !studentId) {
      return Alert.alert('Error', 'Please select a student');
    }

    if (isStudentEnd && !studentId) {
      return Alert.alert('Error', 'Student details could not be loaded');
    }

    if (isStudentEnd && !reference.trim()) {
      return Alert.alert('Error', 'Transaction ID is required');
    }

    try {
      setSubmitting(true);

      const formData = new FormData();

      formData.append('amount', amount);
      formData.append('method', method);
      formData.append('studentId', studentId);

      if (!isStudentEnd && sessionId) {
        formData.append('session', sessionId);
      }

      if (reference.trim()) {
        formData.append('reference', reference.trim());
      }

      if (receipt) {
        const fileName =
          receipt.fileName ||
          receipt.uri.split('/').pop() ||
          `receipt_${Date.now()}.jpg`;

        const fileType =
          receipt.mimeType ||
          'image/jpeg';

        formData.append('receipt', {
          uri: receipt.uri,
          type: fileType,
          name: fileName,
        });
      }

      await createPayment(formData);

      if (isStudentEnd) {
        Alert.alert(
          'Payment Submitted Successfully',
          'Your bank transfer payment details were submitted successfully. You can save your transaction receipt as a PDF.',
          [
            {
              text: 'Save Receipt PDF',
              onPress: handleSaveReceiptPdf,
            },
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Success', 'Payment recorded successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (err) {
      console.log('Create payment error:', err.response?.data || err.message);

      Alert.alert(
        'Error',
        err.response?.data?.message || 'Could not record payment'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const paymentMethods = isStudentEnd ? ['Bank Transfer'] : ADMIN_METHODS;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.brandOrange} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {isStudentEnd ? 'Pay Course Fee' : 'Record Payment'}
        </Text>

        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isStudentEnd && student && (
          <View style={styles.studentInfoCard}>
            <Text style={styles.studentInfoTitle}>Student Details</Text>
            <Text style={styles.studentInfoName}>
              {student.firstName} {student.lastName}
            </Text>
            <Text style={styles.studentInfoText}>{student.email}</Text>
            <Text style={styles.studentInfoText}>NIC: {student.NIC}</Text>
          </View>
        )}

        <Text style={styles.label}>Amount (LKR) *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 5000"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Payment Method *</Text>
        <View style={styles.methodRow}>
          {paymentMethods.map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.methodBtn, method === m && styles.methodBtnActive]}
              onPress={() => setMethod(m)}
              disabled={isStudentEnd}
            >
              <Ionicons
                name={
                  m === 'Card'
                    ? 'card-outline'
                    : m === 'Cash'
                    ? 'cash-outline'
                    : 'business-outline'
                }
                size={18}
                color={method === m ? COLORS.black : COLORS.textMuted}
              />

              <Text
                style={[
                  styles.methodText,
                  method === m && styles.methodTextActive,
                ]}
              >
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isStudentEnd && (
          <View style={styles.bankNoteCard}>
            <View style={styles.bankNoteHeader}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color={COLORS.brandOrange}
              />
              <Text style={styles.bankNoteTitle}>Bank Transfer Details</Text>
            </View>

            <Text style={styles.bankNoteText}>
              You can pay your course fee via bank transfer. Please transfer the
              amount to the following account and enter your transaction ID below.
            </Text>

            <View style={styles.accountBox}>
              <Text style={styles.accountText}>Account Name: DriveOn Driving School</Text>
              <Text style={styles.accountText}>Bank: Bank of Ceylon</Text>
              <Text style={styles.accountText}>Branch: Colombo</Text>
              <Text style={styles.accountText}>Account No: 1234567890</Text>
              <Text style={styles.accountText}>Reference: Student NIC / Name</Text>
            </View>
          </View>
        )}

        <Text style={styles.label}>
          {isStudentEnd ? 'Transaction ID *' : 'Reference / Transaction ID'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="e.g. TXN123456"
          value={reference}
          onChangeText={setReference}
          autoCapitalize="characters"
        />

        {!isStudentEnd && (
          <>
            <Text style={styles.label}>Student *</Text>

            {students.length === 0 ? (
              <Text style={styles.noSessions}>No students found</Text>
            ) : (
              students.map(s => (
                <TouchableOpacity
                  key={s._id}
                  style={[
                    styles.sessionCard,
                    studentId === s._id && styles.sessionCardActive,
                  ]}
                  onPress={() => setStudentId(studentId === s._id ? '' : s._id)}
                >
                  <View style={styles.flex1}>
                    <Text style={styles.sessionType}>
                      {s.firstName} {s.lastName}
                    </Text>
                    <Text style={styles.sessionMeta}>
                      {s.email} · {s.NIC}
                    </Text>
                  </View>

                  {studentId === s._id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={COLORS.green}
                    />
                  )}
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {!isStudentEnd && (
          <>
            <Text style={styles.label}>Link to Session (optional)</Text>

            {sessions.length === 0 ? (
              <Text style={styles.noSessions}>
                No scheduled or completed sessions available
              </Text>
            ) : (
              sessions.map(s => (
                <TouchableOpacity
                  key={s._id}
                  style={[
                    styles.sessionCard,
                    sessionId === s._id && styles.sessionCardActive,
                  ]}
                  onPress={() => setSessionId(sessionId === s._id ? '' : s._id)}
                >
                  <View style={styles.flex1}>
                    <Text style={styles.sessionType}>
                      {s.sessionType || s.type} Session
                    </Text>

                    <Text style={styles.sessionMeta}>
                      {new Date(s.date).toDateString()} · {s.startTime}
                    </Text>
                  </View>

                  {sessionId === s._id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={COLORS.green}
                    />
                  )}
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        <Text style={[styles.label, { marginTop: 8 }]}>
          Upload Receipt {isStudentEnd ? '*' : '(optional)'}
        </Text>

        <TouchableOpacity style={styles.uploadBtn} onPress={pickReceipt}>
          {receipt ? (
            <Image source={{ uri: receipt.uri }} style={styles.receiptPreview} />
          ) : (
            <>
              <Ionicons
                name="cloud-upload-outline"
                size={28}
                color={COLORS.textMuted}
              />
              <Text style={styles.uploadText}>Tap to upload receipt image</Text>
              <Text style={styles.uploadSubtext}>JPG, PNG, WEBP up to 5MB</Text>
            </>
          )}
        </TouchableOpacity>

        {receipt && (
          <TouchableOpacity onPress={() => setReceipt(null)}>
            <Text style={styles.removeText}>Remove image</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitBtnText}>
              {isStudentEnd ? 'Submit Bank Transfer Payment' : 'Record Payment'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    backgroundColor: COLORS.gray,
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 8,
  },

  input: {
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 16,
  },

  methodRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },

  methodBtn: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  methodBtnActive: {
    backgroundColor: COLORS.brandYellow,
    borderColor: COLORS.brandOrange,
  },

  methodText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },

  methodTextActive: {
    color: COLORS.black,
    fontWeight: '700',
  },

  studentInfoCard: {
    backgroundColor: COLORS.brandYellow,
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
  },

  studentInfoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 4,
  },

  studentInfoName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.black,
  },

  studentInfoText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  bankNoteCard: {
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },

  bankNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },

  bankNoteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.black,
  },

  bankNoteText: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 19,
    marginBottom: 10,
  },

  accountBox: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },

  accountText: {
    fontSize: 13,
    color: COLORS.black,
    marginBottom: 4,
    fontWeight: '500',
  },

  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },

  sessionCardActive: {
    borderColor: COLORS.green,
    backgroundColor: COLORS.greenBg,
  },

  flex1: {
    flex: 1,
  },

  sessionType: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
  },

  sessionMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  noSessions: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 16,
  },

  uploadBtn: {
    backgroundColor: COLORS.bgLight,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    borderRadius: 14,
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginBottom: 8,
  },

  uploadText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: 8,
  },

  uploadSubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  receiptPreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    resizeMode: 'cover',
  },

  removeText: {
    fontSize: 13,
    color: COLORS.red,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },

  submitBtn: {
    backgroundColor: COLORS.brandOrange,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },

  submitBtnDisabled: {
    opacity: 0.7,
  },

  submitBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});