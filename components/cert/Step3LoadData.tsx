'use client';

import * as React from 'react';
import { parseCsvFile, parseExcelFile, ParsedData } from '@/lib/cert/dataParser';
import { CertField, CertRow } from '@/lib/cert/types';

interface Step3LoadDataProps {
  fields: CertField[];
  rows: CertRow[];
  onChangeRows: (rows: CertRow[]) => void;
  onUpdateFieldMapping: (fieldId: string, colName: string | null) => void;
  initialEventId?: string | null;
}

export function Step3LoadData({
  fields,
  rows,
  onChangeRows,
  onUpdateFieldMapping,
  initialEventId = null
}: Step3LoadDataProps) {
  const [activeTab, setActiveTab] = React.useState<'file' | 'manual' | 'event'>('file');
  const [parsedData, setParsedData] = React.useState<ParsedData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Event tab states
  const [events, setEvents] = React.useState<{ id: string; title: string; club_name: string; event_date: string }[]>([]);
  const [selectedEventId, setSelectedEventId] = React.useState<string>(initialEventId || '');
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'checked_in' | 'absent'>('checked_in');
  const [loadingEvents, setLoadingEvents] = React.useState(false);

  // Manual records rows list
  const [manualRows, setManualRows] = React.useState<Record<string, string>[]>([
    fields.reduce((acc, f) => ({ ...acc, [f.label]: '' }), {})
  ]);

  // Load event attendees handler
  const loadEventAttendees = async (eventId: string, filter: 'all' | 'checked_in' | 'absent') => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      const { getAttendeesForCertificate } = await import('@/lib/actions/cert-actions');
      const onlyCheckedIn = filter === 'checked_in';
      const res = await getAttendeesForCertificate(eventId, { onlyCheckedIn });
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.data) {
        let filteredData = res.data;
        if (filter === 'absent') {
          filteredData = res.data.filter(r => r.Status === 'Absent');
        } else if (filter === 'checked_in') {
          filteredData = res.data.filter(r => r.Status === 'Checked-in');
        }
        
        // Convert to parsedData format for preview
        const headers = ['Name', 'USN', 'Department', 'Semester', 'Year', 'Email', 'Event', 'EventDate', 'Status'];
        const formattedRows = filteredData.map(d => ({
          Name: d.Name,
          USN: d.USN,
          Department: d.Department,
          Semester: d.Semester,
          Year: d.Year,
          Email: d.Email,
          Event: d.Event,
          EventDate: d.EventDate,
          Status: d.Status
        }));
        
        setParsedData({
          headers,
          rows: formattedRows
        });

        const certRows: CertRow[] = formattedRows.map((r, i) => ({
          id: `row_${i}_${Date.now()}`,
          data: r,
          status: 'pending',
          outputBlob: null,
          editedBlob: null
        }));
        onChangeRows(certRows);

        // Auto-mapper using smart columnMapper aliases
        const { isHeaderMatch } = await import('@/lib/cert/columnMapper');
        fields.forEach(f => {
          const matchingCol = headers.find(h => isHeaderMatch(h, f.label) || (f.dataColumn && isHeaderMatch(h, f.dataColumn)));
          if (matchingCol) {
            onUpdateFieldMapping(f.id, matchingCol);
          } else {
            onUpdateFieldMapping(f.id, null);
          }
        });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch event attendees.');
    } finally {
      setLoading(false);
    }
  };

  // Switch to event tab and load automatically if initialEventId is present on mount
  React.useEffect(() => {
    if (initialEventId) {
      setActiveTab('event');
      loadEventAttendees(initialEventId, filterStatus);
    }
  }, [initialEventId]);

  // Load events list for picker when event tab is opened
  React.useEffect(() => {
    if (activeTab === 'event') {
      setLoadingEvents(true);
      import('@/lib/actions/cert-actions')
        .then(({ getEligibleEventsForCertificates }) => getEligibleEventsForCertificates())
        .then(res => {
          if (res.data) setEvents(res.data);
          if (res.error) setError(res.error);
        })
        .finally(() => setLoadingEvents(false));
    }
  }, [activeTab]);

  // Tab change handler
  const handleTabChange = (tab: 'file' | 'manual' | 'event') => {
    setActiveTab(tab);
    setError(null);
    if (tab === 'manual') {
      // Synced to placed fields
      const emptyRow = fields.reduce((acc, f) => ({ ...acc, [f.label]: '' }), {});
      setManualRows([emptyRow]);
      onChangeRows([{
        id: `manual_0`,
        data: emptyRow,
        status: 'pending',
        outputBlob: null,
        editedBlob: null
      }]);
      // Set field mapping automatically for manual entry (mapping field labels to themselves)
      fields.forEach(f => onUpdateFieldMapping(f.id, f.label));
    } else {
      onChangeRows([]);
      setParsedData(null);
      if (tab === 'event' && selectedEventId) {
        loadEventAttendees(selectedEventId, filterStatus);
      }
    }
  };

  // Drag/Drop and Select handler for Spreadsheet files
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    
    setLoading(true);
    setError(null);
    try {
      let data: ParsedData;
      if (file.name.endsWith('.csv')) {
        data = await parseCsvFile(file);
      } else {
        data = await parseExcelFile(file);
      }

      setParsedData(data);
      
      // Construct in-memory cert row states
      const certRows: CertRow[] = data.rows.map((r, i) => ({
        id: `row_${i}_${Date.now()}`,
        data: r,
        status: 'pending',
        outputBlob: null,
        editedBlob: null
      }));
      onChangeRows(certRows);

      // Auto-mapper: if column header matches the field label exactly (case-insensitive), auto-map!
      const { isHeaderMatch } = await import('@/lib/cert/columnMapper');
      fields.forEach(f => {
        const matchingCol = data.headers.find(h => isHeaderMatch(h, f.label) || (f.dataColumn && isHeaderMatch(h, f.dataColumn)));
        if (matchingCol) {
          onUpdateFieldMapping(f.id, matchingCol);
        } else {
          onUpdateFieldMapping(f.id, null);
        }
      });
    } catch (err) {
      console.error(err);
      setError('Failed to parse sheet. Please ensure it is a valid CSV or Excel document.');
    } finally {
      setLoading(false);
    }
  };

  // Manual records modifiers
  const handleManualValueChange = (rowIndex: number, label: string, value: string) => {
    const nextManual = manualRows.map((r, i) => {
      if (i === rowIndex) {
        return { ...r, [label]: value };
      }
      return r;
    });
    setManualRows(nextManual);

    const nextRows: CertRow[] = nextManual.map((r, i) => ({
      id: `manual_${i}`,
      data: r,
      status: 'pending',
      outputBlob: null,
      editedBlob: null
    }));
    onChangeRows(nextRows);
  };

  const addManualRow = () => {
    const emptyRow = fields.reduce((acc, f) => ({ ...acc, [f.label]: '' }), {});
    const nextManual = [...manualRows, emptyRow];
    setManualRows(nextManual);

    const nextRows: CertRow[] = nextManual.map((r, i) => ({
      id: `manual_${i}`,
      data: r,
      status: 'pending',
      outputBlob: null,
      editedBlob: null
    }));
    onChangeRows(nextRows);
  };

  const removeManualRow = (index: number) => {
    if (manualRows.length <= 1) return;
    const nextManual = manualRows.filter((_, i) => i !== index);
    setManualRows(nextManual);

    const nextRows: CertRow[] = nextManual.map((r, i) => ({
      id: `manual_${i}`,
      data: r,
      status: 'pending',
      outputBlob: null,
      editedBlob: null
    }));
    onChangeRows(nextRows);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      <div className="flex border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden font-bold text-sm w-fit mx-auto">
        <button
          type="button"
          onClick={() => handleTabChange('file')}
          className={`px-6 py-2.5 transition-colors ${
            activeTab === 'file'
              ? 'bg-[#0a0a0a] text-white dark:bg-white dark:text-black'
              : 'bg-transparent text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900'
          }`}
        >
          📂 Upload spreadsheet (CSV/Excel)
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('event')}
          className={`px-6 py-2.5 transition-colors ${
            activeTab === 'event'
              ? 'bg-[#0a0a0a] text-white dark:bg-white dark:text-black'
              : 'bg-transparent text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900'
          }`}
        >
          🎫 From Event Attendees
        </button>
        <button
          type="button"
          onClick={() => handleTabChange('manual')}
          className={`px-6 py-2.5 transition-colors ${
            activeTab === 'manual'
              ? 'bg-[#0a0a0a] text-white dark:bg-white dark:text-black'
              : 'bg-transparent text-zinc-500 hover:text-black dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900'
          }`}
        >
          ✍️ Manual records entry
        </button>
      </div>

      {activeTab === 'event' && (
        <div className="space-y-6">
          <div className="p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-4">
            <h3 className="font-bold text-base dark:text-white">Select Event & Registration Filter</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Select Event</label>
                {loadingEvents ? (
                  <div className="text-xs text-zinc-400 font-mono py-2">Loading events...</div>
                ) : (
                  <select
                    value={selectedEventId}
                    onChange={(e) => {
                      setSelectedEventId(e.target.value);
                      loadEventAttendees(e.target.value, filterStatus);
                    }}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:border-black"
                  >
                    <option value="">-- Choose an Event --</option>
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} ({ev.club_name} - {new Date(ev.event_date).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Filter Attendance Status</label>
                <div className="flex bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-0.5 rounded-xl text-xs font-bold">
                  {(['checked_in', 'all', 'absent'] as const).map(status => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        setFilterStatus(status);
                        if (selectedEventId) {
                          loadEventAttendees(selectedEventId, status);
                        }
                      }}
                      className={`flex-1 py-1.5 rounded-lg capitalize transition-colors ${
                        filterStatus === status
                          ? 'bg-[#0a0a0a] text-white dark:bg-white dark:text-black font-extrabold'
                          : 'text-zinc-400 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      {status === 'checked_in' ? 'Checked In' : status === 'all' ? 'All Registered' : 'Absent'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {loading && (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mt-2">Loading attendees...</p>
            </div>
          )}

          {parsedData && !loading && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <div>
                  <span className="font-bold text-base dark:text-white">Column Mapping & Configuration</span>
                  <span className="text-xs text-zinc-400 block mt-0.5">Map event attendee data columns to certificate templates.</span>
                </div>
              </div>

              {/* Mapper selects grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fields.map((field) => (
                  <div key={field.id} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col space-y-1.5">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-tight">{field.label}</span>
                    <select
                      value={field.dataColumn || ''}
                      onChange={(e) => onUpdateFieldMapping(field.id, e.target.value || null)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:border-black"
                    >
                      <option value="">-- Manual Fallback Text --</option>
                      {parsedData.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Data Preview Table */}
              <div className="space-y-3">
                <span className="font-bold text-sm block dark:text-white font-sans">
                  Imported Attendees List ({rows.length} records mapped)
                </span>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-900 font-bold uppercase border-b border-zinc-200 dark:border-zinc-800">
                      <tr>
                        {parsedData.headers.map(h => (
                          <th key={h} className="p-3 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
                      {parsedData.rows.slice(0, 10).map((row, i) => (
                        <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                          {parsedData.headers.map(h => (
                            <td key={h} className="p-3 text-zinc-600 dark:text-zinc-400 truncate max-w-[200px]" title={row[h]}>
                              {row[h]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedData.rows.length > 10 && (
                  <span className="text-[10px] text-zinc-400 font-mono italic block text-right">
                    Showing first 10 rows. Entire queue loaded successfully.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'file' ? (
        <div className="space-y-6">
          {/* File Drag and Drop zone */}
          {!parsedData ? (
            <div className="relative border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-12 text-center hover:border-black dark:hover:border-zinc-400 transition-colors flex flex-col items-center justify-center min-h-[220px]">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center mx-auto text-zinc-400 text-lg">
                  📊
                </div>
                <div>
                  <p className="font-bold text-sm dark:text-white">Drag and drop spreadsheet, or click to browse</p>
                  <p className="text-xs text-zinc-400 mt-1 font-mono">Supports .csv, .xlsx, .xls</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <div>
                  <span className="font-bold text-base dark:text-white">Column Mapping & Configuration</span>
                  <span className="text-xs text-zinc-400 block mt-0.5">Map your sheet headers directly to placed visual fields.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setParsedData(null)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 hover:border-black text-xs transition-all dark:border-zinc-800"
                >
                  Clear File
                </button>
              </div>

              {/* Mapper selects grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fields.map((field) => (
                  <div key={field.id} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col space-y-1.5">
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-tight">{field.label}</span>
                    <select
                      value={field.dataColumn || ''}
                      onChange={(e) => onUpdateFieldMapping(field.id, e.target.value || null)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:border-black"
                    >
                      <option value="">-- Manual Fallback Text --</option>
                      {parsedData.headers.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Data Preview Table */}
              <div className="space-y-3">
                <span className="font-bold text-sm block dark:text-white">
                  Ingested Data Preview ({rows.length} rows found)
                </span>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-900 font-bold uppercase border-b border-zinc-200 dark:border-zinc-800">
                      <tr>
                        {parsedData.headers.map(h => (
                          <th key={h} className="p-3 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 bg-white dark:bg-zinc-950">
                      {parsedData.rows.slice(0, 10).map((row, i) => (
                        <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                          {parsedData.headers.map(h => (
                            <td key={h} className="p-3 text-zinc-600 dark:text-zinc-400 truncate max-w-[200px]" title={row[h]}>
                              {row[h]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedData.rows.length > 10 && (
                  <span className="text-[10px] text-zinc-400 font-mono italic block text-right">
                    Showing first 10 rows. Entire queue loaded successfully.
                  </span>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 text-xs font-mono border border-red-100 dark:border-red-900/50 text-center">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <span className="font-bold text-sm block dark:text-white">Manual Record Matrix</span>
              <span className="text-xs text-zinc-400">Type record details directly to build certificates manually.</span>
            </div>
            <button
              type="button"
              onClick={addManualRow}
              className="px-3 py-1.5 bg-[#0a0a0a] text-white dark:bg-white dark:text-black rounded-xl text-xs font-bold hover:scale-102 transition-transform"
            >
              + Add Record Row
            </button>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-[2rem] overflow-hidden bg-white dark:bg-zinc-950">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-bold uppercase tracking-wider text-[10px] text-zinc-400 font-mono">
                <tr>
                  <th className="p-4 w-12 text-center">#</th>
                  {fields.map(f => (
                    <th key={f.id} className="p-4">{f.label}</th>
                  ))}
                  <th className="p-4 w-16 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {manualRows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                    <td className="p-4 text-center font-mono text-zinc-400">{rowIndex + 1}</td>
                    {fields.map(f => (
                      <td key={f.id} className="p-4">
                        <input
                          type="text"
                          value={row[f.label] || ''}
                          onChange={(e) => handleManualValueChange(rowIndex, f.label, e.target.value)}
                          placeholder={`Enter ${f.label}`}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 focus:outline-none focus:border-black"
                        />
                      </td>
                    ))}
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => removeManualRow(rowIndex)}
                        disabled={manualRows.length <= 1}
                        className="text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs transition-colors"
                      >
                        ✕ Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
