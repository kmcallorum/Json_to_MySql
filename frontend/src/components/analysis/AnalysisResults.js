import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const AnalysisResults = ({ analysis, metadata }) => {
    return (_jsxs("div", { style: { padding: '20px' }, children: [_jsx("h2", { children: "Discovered Schema" }), metadata && (_jsxs("div", { style: {
                    marginBottom: '20px',
                    padding: '15px',
                    backgroundColor: '#d1ecf1',
                    borderRadius: '4px',
                    border: '1px solid #bee5eb'
                }, children: [_jsx("h3", { style: { marginTop: 0 }, children: "Source Information" }), _jsxs("p", { children: [_jsx("strong", { children: "Source Table:" }), " ", metadata.toProcessTable] }), _jsxs("p", { children: [_jsx("strong", { children: "Destination Table:" }), " ", metadata.baseTableName] }), _jsxs("p", { children: [_jsx("strong", { children: "Event Type Filter:" }), " ", metadata.eventType] }), _jsxs("p", { children: [_jsx("strong", { children: "Total Records in Table:" }), " ", metadata.totalRecordsInTable.toLocaleString()] }), _jsxs("p", { children: [_jsx("strong", { children: "Analyzed Sample:" }), " ", metadata.sampledRecords, " records"] })] })), _jsx("div", { style: { marginBottom: '20px', color: '#666' }, children: _jsxs("p", { children: ["Found ", analysis.fields.length, " unique field(s)"] }) }), _jsx("div", { style: { overflowX: 'auto' }, children: _jsxs("table", { style: {
                        width: '100%',
                        borderCollapse: 'collapse',
                        border: '1px solid #ddd',
                    }, children: [_jsx("thead", { children: _jsxs("tr", { style: { backgroundColor: '#f8f9fa' }, children: [_jsx("th", { style: tableHeaderStyle, children: "Field Path" }), _jsx("th", { style: tableHeaderStyle, children: "Type" }), _jsx("th", { style: tableHeaderStyle, children: "Array?" }), _jsx("th", { style: tableHeaderStyle, children: "Nullable?" }), _jsx("th", { style: tableHeaderStyle, children: "Samples" }), _jsx("th", { style: tableHeaderStyle, children: "Suggested Table" }), _jsx("th", { style: tableHeaderStyle, children: "Suggested Column" }), _jsx("th", { style: tableHeaderStyle, children: "SQL Type" })] }) }), _jsx("tbody", { children: analysis.fields.map((field, index) => (_jsxs("tr", { style: {
                                    backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
                                }, children: [_jsx("td", { style: tableCellStyle, children: _jsx("code", { children: field.path }) }), _jsx("td", { style: tableCellStyle, children: Array.from(field.types).join(', ') }), _jsx("td", { style: tableCellStyle, children: field.isArray ? '✓' : '' }), _jsx("td", { style: tableCellStyle, children: field.isNullable ? '✓' : '' }), _jsx("td", { style: tableCellStyle, children: _jsx("div", { style: { maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }, children: field.samples.map((s, i) => (_jsx("span", { style: {
                                                    display: 'inline-block',
                                                    padding: '2px 6px',
                                                    margin: '2px',
                                                    backgroundColor: '#e9ecef',
                                                    borderRadius: '3px',
                                                    fontSize: '12px',
                                                }, children: JSON.stringify(s) }, i))) }) }), _jsx("td", { style: tableCellStyle, children: _jsx("strong", { children: field.suggestedTable }) }), _jsx("td", { style: tableCellStyle, children: field.suggestedColumn }), _jsx("td", { style: tableCellStyle, children: _jsx("code", { children: field.suggestedType }) })] }, field.path))) })] }) })] }));
};
const tableHeaderStyle = {
    padding: '12px',
    textAlign: 'left',
    borderBottom: '2px solid #dee2e6',
    fontWeight: 'bold',
};
const tableCellStyle = {
    padding: '12px',
    borderBottom: '1px solid #dee2e6',
};
