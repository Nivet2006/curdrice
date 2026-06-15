import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register Fonts if needed - using standard ones for now
// Font.register({ family: 'Helvetica', src: ... });

const styles = StyleSheet.create({
  page: {
    padding: 50,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottom: '0.5pt solid #CCCCCC',
    paddingBottom: 5,
  },
  headerText: {
    fontSize: 8,
    color: '#1B2A6B',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    borderTop: '0.5pt solid #CCCCCC',
    paddingTop: 5,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 7,
    color: '#888888',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B2A6B',
    textTransform: 'uppercase',
  },
  subTitle: {
    fontSize: 14,
    color: '#1B2A6B',
    marginTop: 5,
  },
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#1B2A6B',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomColor: '#CCCCCC',
    borderBottomWidth: 0.5,
    minHeight: 25,
    alignItems: 'center',
  },
  tableCellLabel: {
    width: '30%',
    padding: 5,
    backgroundColor: '#F0F4FF',
    color: '#1B2A6B',
    fontWeight: 'bold',
    fontSize: 10,
  },
  tableCellValue: {
    width: '70%',
    padding: 5,
    fontSize: 10,
    color: '#333333',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1B2A6B',
    textTransform: 'uppercase',
    textDecoration: 'underline',
    marginBottom: 10,
    marginTop: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: 10,
  },
  image: {
    width: '100%',
    borderRadius: 2,
  },
  caption: {
    fontSize: 8,
    fontStyle: 'italic',
    color: '#1B2A6B',
    marginTop: 3,
    textAlign: 'center',
  },
  signatureBlock: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureColumn: {
    width: '30%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderTop: '0.5pt solid #1B2A6B',
    marginBottom: 5,
  },
  signatureTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1B2A6B',
    textAlign: 'center',
  },
  signatureSub: {
    fontSize: 10,
    color: '#1B2A6B',
    textAlign: 'center',
    marginTop: 2,
  },
  lastLine: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 9,
    fontStyle: 'italic',
    color: '#888888',
  },
});

export const IICReportDocument = ({ data }: { data: any }) => (
  <Document>
    {/* Page 1: Cover */}
    <Page size="A4" style={styles.page}>
      <View style={styles.logoContainer}>
        {data.gcemLogo && <Image src={data.gcemLogo} style={styles.logo} />}
        {data.iicLogo && <Image src={data.iicLogo} style={styles.logo} />}
      </View>
      
      <View style={styles.titleContainer}>
        <Text style={styles.mainTitle}>IIC – Institution Innovation Council</Text>
        <Text style={styles.subTitle}>Event Report</Text>
      </View>

      <View style={styles.table}>
        {[
          ["Event Name", data.event.title],
          ["Event Type", data.event.type],
          ["Date & Time", `${data.event.event_date} | ${data.event.time || 'N/A'}`],
          ["Venue", data.event.venue || 'N/A'],
          ["Duration", data.event.duration || 'N/A'],
          ["Organized By", data.event.organized_by || 'N/A'],
          ["Mode", data.event.mode],
          ["Theme / Domain", data.event.theme || 'N/A'],
          ["Objective", data.event.objective || 'N/A'],
          ["Target Audience", data.event.target_audience || 'N/A'],
          ["Expected Outcomes", data.event.expected_outcomes || 'N/A'],
          ["Description", data.event.description || 'N/A'],
        ].map(([label, value], i) => (
          <View key={i} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#F0F4FF' : '#FFFFFF' }]}>
            <Text style={styles.tableCellLabel}>{label}</Text>
            <Text style={styles.tableCellValue}>{value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Confidential – IIC {data.collegeName || 'GCEM'}</Text>
      </View>
    </Page>

    {/* Page 1.5: Resource Persons */}
    {data.resourcePersons && data.resourcePersons.length > 0 && (
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeader}>Resource Persons</Text>
        <View style={styles.table}>
          {(data.event.level === 'Institute' || data.event.level === 'Department') ? (
            <>
              <View style={[styles.tableRow, { backgroundColor: '#1B2A6B' }]}>
                {['S.No', 'Name', 'USN', 'Department', 'Mobile', 'Email'].map((h, i) => (
                  <Text key={i} style={[styles.tableCellLabel, { backgroundColor: 'transparent', color: 'white', width: i === 0 ? '8%' : i === 1 ? '22%' : i === 5 ? '26%' : '16%' }]}>{h}</Text>
                ))}
              </View>
              {data.resourcePersons.map((rp: any, i: number) => (
                <View key={i} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#EEF2FF' }]}>
                  <Text style={[styles.tableCellValue, { width: '8%' }]}>{i + 1}</Text>
                  <Text style={[styles.tableCellValue, { width: '22%' }]}>{rp.name || 'N/A'}</Text>
                  <Text style={[styles.tableCellValue, { width: '16%' }]}>{rp.usn || 'N/A'}</Text>
                  <Text style={[styles.tableCellValue, { width: '16%' }]}>{rp.department || 'N/A'}</Text>
                  <Text style={[styles.tableCellValue, { width: '16%' }]}>{rp.mobile || 'N/A'}</Text>
                  <Text style={[styles.tableCellValue, { width: '26%' }]}>{rp.email || 'N/A'}</Text>
                </View>
              ))}
            </>
          ) : (
            <>
              <View style={[styles.tableRow, { backgroundColor: '#1B2A6B' }]}>
                {['S.No', 'Name', 'Designation & Org', 'Mobile / Email', 'Address'].map((h, i) => (
                  <Text key={i} style={[styles.tableCellLabel, { backgroundColor: 'transparent', color: 'white', width: i === 0 ? '8%' : i === 1 ? '20%' : i === 2 ? '28%' : i === 3 ? '24%' : '20%' }]}>{h}</Text>
                ))}
              </View>
              {data.resourcePersons.map((rp: any, i: number) => (
                <View key={i} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#EEF2FF' }]}>
                  <Text style={[styles.tableCellValue, { width: '8%' }]}>{i + 1}</Text>
                  <Text style={[styles.tableCellValue, { width: '20%' }]}>{rp.name || 'N/A'}</Text>
                  <Text style={[styles.tableCellValue, { width: '28%' }]}>{`${rp.designation || 'N/A'} - ${rp.organization || 'N/A'}`}</Text>
                  <Text style={[styles.tableCellValue, { width: '24%' }]}>{`${rp.mobile || 'N/A'} / ${rp.email || 'N/A'}`}</Text>
                  <Text style={[styles.tableCellValue, { width: '20%' }]}>{rp.address || 'N/A'}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      </Page>
    )}

    {/* Page 2: Registration (External only) */}
    {data.event.type === 'External' && (
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeader}>Registration Details</Text>
        <View style={styles.table}>
            <View style={[styles.tableRow, { backgroundColor: '#1B2A6B' }]}>
                {['S.No', 'Name', 'USN', 'Department', 'Phone', 'College'].map((h, i) => (
                    <Text key={i} style={[styles.tableCellLabel, { backgroundColor: 'transparent', color: 'white', width: i === 0 ? '10%' : '18%' }]}>{h}</Text>
                ))}
            </View>
            {data.registrations && data.registrations.map((reg: any, i: number) => (
                <View key={i} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#EEF2FF' }]}>
                    <Text style={[styles.tableCellValue, { width: '10%' }]}>{i + 1}</Text>
                    <Text style={[styles.tableCellValue, { width: '18%' }]}>{reg.full_name}</Text>
                    <Text style={[styles.tableCellValue, { width: '18%' }]}>{reg.usn}</Text>
                    <Text style={[styles.tableCellValue, { width: '18%' }]}>{reg.department}</Text>
                    <Text style={[styles.tableCellValue, { width: '18%' }]}>{reg.phone || 'N/A'}</Text>
                    <Text style={[styles.tableCellValue, { width: '18%' }]}>{reg.college_name || 'N/A'}</Text>
                </View>
            ))}
        </View>
      </Page>
    )}

    {/* Page 3: Attendance (Filtered) */}
    <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeader}>Attendance Details</Text>
        <View style={styles.table}>
            <View style={[styles.tableRow, { backgroundColor: '#1B2A6B' }]}>
                {['S.No', 'Name', 'USN', 'Department', 'Semester', 'Year'].map((h, i) => (
                    <Text key={i} style={[styles.tableCellLabel, { backgroundColor: 'transparent', color: 'white', width: i === 0 ? '10%' : '18%' }]}>{h}</Text>
                ))}
            </View>
            {data.attendance && data.attendance.map((att: any, i: number) => (
                <View key={i} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#EEF2FF' }]}>
                    <Text style={[styles.tableCellValue, { width: '10%' }]}>{i + 1}</Text>
                    <Text style={[styles.tableCellValue, { width: '18%' }]}>{att.full_name}</Text>
                    <Text style={[styles.tableCellValue, { width: '18%' }]}>{att.usn}</Text>
                    <Text style={[styles.tableCellValue, { width: '18%' }]}>{att.department}</Text>
                    <Text style={[styles.tableCellValue, { width: '18%' }]}>{att.semester}</Text>
                    <Text style={[styles.tableCellValue, { width: '18%' }]}>{att.year}</Text>
                </View>
            ))}
        </View>
        <Text style={{ fontSize: 8, fontStyle: 'italic', color: '#888888', marginTop: 10 }}>
            * Attendance confirmed only for participants who completed the feedback form.
        </Text>
    </Page>

    {/* Page 4: Feedback Summary */}
    <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeader}>Feedback Analysis</Text>
        <View style={styles.grid}>
            {data.feedbackCharts && data.feedbackCharts.map((chart: any, i: number) => (
                <View key={i} style={styles.gridItem}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>{chart.question}</Text>
                    <Image src={chart.buffer} style={{ height: 180 }} />
                    <Text style={{ fontSize: 8, marginTop: 3 }}>Total Responses: {chart.count}</Text>
                </View>
            ))}
        </View>
    </Page>

    {/* Page 5: Flyers */}
    <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeader}>Event Flyers</Text>
        <View style={styles.grid}>
            {data.flyers && data.flyers.map((url: string, i: number) => (
                <View key={i} style={styles.gridItem}>
                    <Image src={url} style={styles.image} />
                    <Text style={styles.caption}>Flyer {i + 1}</Text>
                </View>
            ))}
        </View>
    </Page>

    {/* Page 6: Photo Collage */}
    <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeader}>Event Photo Collage</Text>
        <View style={styles.grid}>
            {data.photos && data.photos.map((photo: any, i: number) => (
                <View key={i} style={[styles.gridItem, { width: '30%', height: 120, position: 'relative' }]}>
                    <Image src={photo.url} style={{ height: '100%' }} />
                    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', padding: 2 }}>
                        <Text style={{ color: 'white', fontSize: 6 }}>📍 {photo.location_tag || data.event.title}</Text>
                    </View>
                </View>
            ))}
        </View>
    </Page>

    {/* Page 7: Social Media */}
    <Page size="A4" style={styles.page}>
        <Text style={styles.sectionHeader}>Social Media Presence</Text>
        <View style={{ alignItems: 'center', marginTop: 20 }}>
            {data.socialMedia && data.socialMedia.map((sm: any, i: number) => (
                <View key={i} style={{ flexDirection: 'row', marginBottom: 10, alignItems: 'center' }}>
                    <Text style={{ fontSize: 14 }}>🔗</Text>
                    <Text style={{ fontSize: 12, fontWeight: 'bold', marginLeft: 5, width: 100 }}>{sm.platform}</Text>
                    <Text style={{ fontSize: 12, color: '#1B2A6B', textDecoration: 'underline' }}>{sm.handle}</Text>
                </View>
            ))}
        </View>
    </Page>

    {/* Last Page: Signatures */}
    <Page size="A4" style={styles.page}>
        <View style={{ flexGrow: 1 }} />
        <View style={styles.signatureBlock}>
            <View style={styles.signatureColumn}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureTitle}>Prepared By</Text>
                <Text style={styles.signatureSub}>Faculty Coordinator</Text>
            </View>
            <View style={styles.signatureColumn}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureTitle}>Verified by</Text>
                <Text style={styles.signatureSub}>Department HoD</Text>
            </View>
            <View style={styles.signatureColumn}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureTitle}>Approved by</Text>
                <Text style={styles.signatureSub}>IIC President</Text>
            </View>
        </View>
        <Text style={styles.lastLine}>(Digital Signatures can be Enclosed upon Verification)</Text>
    </Page>
  </Document>
);
