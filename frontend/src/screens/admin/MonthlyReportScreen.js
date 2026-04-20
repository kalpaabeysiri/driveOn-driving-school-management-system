import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getMonthlyReport } from '../../services/studentApi';
import { COLORS } from '../../theme';

export default function MonthlyReportScreen({ navigation }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const { data } = await getMonthlyReport(year);
        setReport(data);
      } catch {
        Alert.alert('Error', 'Could not load report');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [year]);

  const escapeHtml = (text = '') =>
    String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const generateHtml = () => {
    const monthlyRows = report?.monthlyBreakdown?.length
      ? report.monthlyBreakdown.map((month) => `
          <div class="month-card">
            <div class="month-header">
              <div class="month-badge">${String(month.monthNumber).padStart(2, '0')}</div>
              <div class="month-info">
                <h3>${escapeHtml(month.month)}</h3>
                <p>
                  Total Registrations: <strong>${month.totalRegistrations}</strong> |
                  Active: <strong style="color:#15803d;">${month.activeStudents}</strong> |
                  Suspended: <strong style="color:#dc2626;">${month.suspendedStudents}</strong>
                </p>
              </div>
            </div>

            ${
              month.students?.length
                ? `
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Student Name</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${month.students.map((student, index) => `
                        <tr>
                          <td>${index + 1}</td>
                          <td>${escapeHtml(student.name)}</td>
                          <td style="color:${student.status === 'Active' ? '#15803d' : '#dc2626'}; font-weight:600;">
                            ${escapeHtml(student.status)}
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                `
                : '<p class="no-data">No students registered in this month.</p>'
            }
          </div>
        `).join('')
      : '<p class="no-data">No registrations found for this year.</p>';

    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              color: #111827;
            }
            .header {
              text-align: center;
              margin-bottom: 24px;
            }
            .brand {
              font-size: 28px;
              font-weight: 800;
              margin-bottom: 6px;
            }
            .brand .o {
              color: #f97316;
            }
            .title {
              font-size: 22px;
              font-weight: 700;
              margin: 0;
            }
            .sub {
              color: #6b7280;
              margin-top: 6px;
              font-size: 13px;
            }
            .summary {
              background: #f97316;
              color: white;
              border-radius: 16px;
              padding: 20px;
              text-align: center;
              margin-bottom: 24px;
            }
            .summary h2 {
              margin: 0;
              font-size: 16px;
              font-weight: 500;
            }
            .summary .count {
              font-size: 42px;
              font-weight: 800;
              margin: 10px 0 6px;
            }
            .section-title {
              font-size: 18px;
              font-weight: 700;
              margin: 20px 0 12px;
            }
            .month-card {
              border: 1px solid #e5e7eb;
              border-radius: 14px;
              padding: 14px;
              margin-bottom: 14px;
              page-break-inside: avoid;
            }
            .month-header {
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 12px;
            }
            .month-badge {
              width: 40px;
              height: 40px;
              border-radius: 10px;
              background: #facc15;
              text-align: center;
              line-height: 40px;
              font-weight: 700;
            }
            .month-info h3 {
              margin: 0;
              font-size: 16px;
            }
            .month-info p {
              margin: 4px 0 0;
              color: #6b7280;
              font-size: 13px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 8px 10px;
              text-align: left;
              font-size: 12px;
            }
            th {
              background: #f9fafb;
              font-weight: 700;
            }
            .no-data {
              color: #6b7280;
              font-size: 13px;
            }
            .footer {
              margin-top: 24px;
              text-align: center;
              color: #9ca3af;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="brand">Drive<span class="o">O</span>n</div>
            <p class="title">Monthly Student Registration Report</p>
            <p class="sub">Generated for year ${year}</p>
          </div>

          <div class="summary">
            <h2>Total Registrations ${year}</h2>
            <div class="count">${report?.totalForYear || 0}</div>
            <div>students registered this year</div>
          </div>

          <div class="section-title">Monthly Breakdown</div>
          ${monthlyRows}

          <div class="footer">
            Generated by DriveOn Report System
          </div>
        </body>
      </html>
    `;
  };

  const handleDownloadPdf = async () => {
    try {
      if (!report) {
        Alert.alert('Error', 'No report data available');
        return;
      }

      setDownloading(true);

      const html = generateHtml();

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Monthly_Report_${year}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Success', `PDF created successfully:\n${uri}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not generate PDF report');
      console.log('PDF generation error:', error);
    } finally {
      setDownloading(false);
    }
  };

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
        <Text style={styles.headerTitle}>Monthly Report</Text>
        <TouchableOpacity
          onPress={handleDownloadPdf}
          disabled={downloading}
          style={styles.downloadBtn}
        >
          {downloading ? (
            <ActivityIndicator size="small" color={COLORS.black} />
          ) : (
            <Ionicons name="download-outline" size={22} color={COLORS.black} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Year Selector */}
        <View style={styles.yearRow}>
          <TouchableOpacity onPress={() => setYear(y => y - 1)} style={styles.yearBtn}>
            <Ionicons name="chevron-back" size={20} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.yearText}>{year}</Text>
          <TouchableOpacity onPress={() => setYear(y => y + 1)} style={styles.yearBtn}>
            <Ionicons name="chevron-forward" size={20} color={COLORS.black} />
          </TouchableOpacity>
        </View>

        {/* Download Button */}
        <TouchableOpacity
          style={styles.pdfBtn}
          onPress={handleDownloadPdf}
          disabled={downloading}
        >
          <Ionicons name="document-text-outline" size={20} color={COLORS.white} />
          <Text style={styles.pdfBtnText}>
            {downloading ? 'Generating PDF...' : 'Download PDF Report'}
          </Text>
        </TouchableOpacity>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Total Registrations {year}</Text>
          <Text style={styles.summaryCount}>{report?.totalForYear || 0}</Text>
          <Text style={styles.summarySubtext}>students registered this year</Text>
        </View>

        {/* Monthly Breakdown */}
        <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
        {report?.monthlyBreakdown?.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No registrations in {year}</Text>
          </View>
        ) : (
          report?.monthlyBreakdown?.map((month) => (
            <TouchableOpacity
              key={month.monthNumber}
              style={styles.monthCard}
              onPress={() => setExpanded(expanded === month.monthNumber ? null : month.monthNumber)}
            >
              <View style={styles.monthHeader}>
                <View style={styles.monthBadge}>
                  <Text style={styles.monthNum}>{String(month.monthNumber).padStart(2, '0')}</Text>
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.monthName}>{month.month}</Text>
                  <Text style={styles.monthMeta}>
                    {month.totalRegistrations} registered ·
                    <Text style={{ color: COLORS.green }}> {month.activeStudents} active</Text> ·
                    <Text style={{ color: COLORS.red }}> {month.suspendedStudents} suspended</Text>
                  </Text>
                </View>
                <Ionicons
                  name={expanded === month.monthNumber ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={COLORS.textMuted}
                />
              </View>

              {expanded === month.monthNumber && (
                <View style={styles.studentList}>
                  {month.students.map((s, i) => (
                    <View key={i} style={styles.studentRow}>
                      <Text style={styles.studentName}>{s.name}</Text>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: s.status === 'Active' ? COLORS.green : COLORS.red,
                          },
                        ]}
                      />
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

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
  headerTitle: { fontSize: 18, fontWeight: '600', color: COLORS.black },
  downloadBtn: {
    width: 24,
    alignItems: 'flex-end',
  },

  content: { padding: 20, paddingBottom: 40 },

  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  yearBtn: {
    backgroundColor: COLORS.bgLight,
    borderRadius: 10,
    padding: 8,
  },
  yearText: { fontSize: 24, fontWeight: '700', color: COLORS.black },

  pdfBtn: {
    backgroundColor: COLORS.brandOrange,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pdfBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },

  summaryCard: {
    backgroundColor: COLORS.brandOrange,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  summaryCount: {
    fontSize: 52,
    fontWeight: '800',
    color: COLORS.white,
  },
  summarySubtext: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 12,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },

  monthCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  monthBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.brandYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNum: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.black,
  },
  flex1: { flex: 1 },
  monthName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.black,
  },
  monthMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },

  studentList: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    padding: 12,
    gap: 8,
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentName: {
    fontSize: 13,
    color: COLORS.textDark,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});