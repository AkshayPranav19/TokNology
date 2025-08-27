import React, { useState, useEffect, useMemo } from 'react';

// Generate mock audit data based on current analysis and comments
const generateAuditData = (title, regions, result, comments) => {
  const baseData = [
    {
      runId: 'run_003',
      timestamp: Date.now() - 10800000,
      featureTitle: 'Chat Moderation System',
      regionsChecked: ['European Union', 'global'],
      regulationsHit: ['DSA', 'GDPR'],
      riskScore: 'Low',
      feedback: { vote: 'Approved' }
    },
    {
      runId: 'run_004',
      timestamp: Date.now() - 14400000,
      featureTitle: 'Live Streaming Features',
      regionsChecked: ['California'],
      regulationsHit: ['CA Kids Act'],
      riskScore: 'High',
      feedback: { vote: 'Rejected' }
    },
    {
      runId: 'run_005',
      timestamp: Date.now() - 18000000,
      featureTitle: 'Profile Customization',
      regionsChecked: ['European Union', 'California', 'Florida'],
      regulationsHit: ['GDPR', 'CCPA'],
      riskScore: 'Medium',
      feedback: { vote: 'Approved' }
    }
  ];

  // Add current analysis if it exists
  if (title && result) {
    const regionMap = {
      'global': 'global',
      'eu': 'European Union',
      'ca': 'California',
      'fl': 'Florida',
      'ut': 'Utah'
    };
    
    const regulationMap = {
      'dsa': 'DSA',
      'ca': 'CA Kids Act', 
      'fl': 'Florida',
      'ut': 'Utah',
      'ncmec': 'NCMEC'
    };

    const mappedRegions = regions.map(r => regionMap[r] || r);
    const mappedRegulations = result.regulationsHit?.map(r => regulationMap[r] || r) || [];
    
    const currentEntry = {
      runId: `run_${Date.now()}`,
      timestamp: Date.now(),
      featureTitle: title,
      regionsChecked: mappedRegions,
      regulationsHit: mappedRegulations,
      riskScore: result.decision === 'REQUIRES_COMPLIANCE_LOGIC' ? 'High' : 
                 result.decision === 'REVIEW_RECOMMENDED' ? 'Medium' : 'Low',
      feedback: comments.length > 0 ? { vote: comments[0].vote === 'approve' ? 'Approved' : 
                                            comments[0].vote === 'reject' ? 'Rejected' : 'Pending' } : { vote: 'Pending' }
    };
    
    return [currentEntry, ...baseData];
  }
  
  return baseData;
};

// Card Component
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
);

// Badge Component
const Badge = ({ children, tone = "gray" }) => {
  const toneClasses = {
    zinc: "bg-gray-100 text-gray-800",
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-800",
    blue: "bg-blue-100 text-blue-800"
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${toneClasses[tone] || toneClasses.zinc}`}>
      {children}
    </span>
  );
};

// Button Component
const Btn = ({ children, onClick, variant = "primary" }) => {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700"
  };
  
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${variants[variant]}`}
    >
      {children}
    </button>
  );
};

// Risk Score Badge
const RiskBadge = ({ risk }) => {
  const riskConfig = {
    'High': { tone: 'red', icon: '🔴' },
    'Medium': { tone: 'yellow', icon: '🟡' },
    'Low': { tone: 'green', icon: '🟢' }
  };
  
  const config = riskConfig[risk] || { tone: 'zinc', icon: '⚪' };
  
  return (
    <div className="flex items-center gap-1">
      <span>{config.icon}</span>
      <Badge tone={config.tone}>{risk}</Badge>
    </div>
  );
};

// Vote Status Badge
const VoteBadge = ({ vote }) => {
  const voteConfig = {
    'Approved': { tone: 'green', icon: '✅' },
    'Rejected': { tone: 'red', icon: '❌' },
    'Pending': { tone: 'yellow', icon: '⏳' }
  };
  
  const config = voteConfig[vote] || { tone: 'zinc', icon: '⚪' };
  
  return (
    <div className="flex items-center gap-1">
      <span>{config.icon}</span>
      <Badge tone={config.tone}>{vote}</Badge>
    </div>
  );
};

// Main AuditLog Component
export default function AuditLog({ 
  initialLimit = 10, 
  title = '', 
  regions = [], 
  result = null, 
  comments = [] 
}) {
  const [showAll, setShowAll] = useState(false);
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("all");
  const [reg, setReg] = useState("all");
  const [selected, setSelected] = useState(null);

  // Generate audit data based on current app state
  const rows = useMemo(() => {
    return generateAuditData(title, regions, result, comments);
  }, [title, regions, result, comments]);

  const filtered = useMemo(() => {
    return rows.filter(r => {
      const text = `${r.featureTitle} ${(r.regulationsHit||[]).join(" ")} ${(r.regionsChecked||[]).join(" ")}`.toLowerCase();
      const passQ = q ? text.includes(q.toLowerCase()) : true;
      const passRegion = region === "all" ? true : (r.regionsChecked||[]).includes(region);
      const passReg = reg === "all" ? true : (r.regulationsHit||[]).includes(reg);
      return passQ && passRegion && passReg;
    });
  }, [rows, q, region, reg]);

  const visible = showAll ? filtered : filtered.slice(0, initialLimit);

  const totalEntries = filtered.length;
  const showingCount = visible.length;

  return (
    <section className="mt-8">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <h3 className="text-xl font-bold text-gray-900">Audit Log & Evidence Trail</h3>
            </div>
            <Badge tone="zinc">append-only</Badge>
          </div>
          
          <div className="text-sm text-gray-500">
            Showing {showingCount} of {totalEntries} entries
          </div>
        </div>

        {/* Search + Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search feature, regulation, region…"
              className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg w-80 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>
          
          <select 
            value={region} 
            onChange={e => setRegion(e.target.value)} 
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            <option value="all">All regions</option>
            <option>European Union</option>
            <option>California</option>
            <option>Florida</option>
            <option>Utah</option>
            <option>global</option>
          </select>
          
          <select 
            value={reg} 
            onChange={e => setReg(e.target.value)} 
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            <option value="all">All regulations</option>
            <option>DSA</option>
            <option>GDPR</option>
            <option>Utah</option>
            <option>Florida</option>
            <option>CA Kids Act</option>
            <option>CCPA</option>
          </select>
          
          {(q || region !== "all" || reg !== "all") && (
            <button
              onClick={() => {
                setQ("");
                setRegion("all");
                setReg("all");
              }}
              className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Time</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Feature</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Regions</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Regulations</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Risk Score</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {visible.map((r, index) => (
                  <tr 
                    key={r.runId} 
                    className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                      selected === r.runId ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelected(selected === r.runId ? null : r.runId)}
                  >
                    <td className="px-4 py-4 text-gray-600">
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{r.featureTitle}</div>
                      <div className="text-xs text-gray-500 mt-1">{r.runId}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(r.regionsChecked || []).map((region, idx) => (
                          <Badge key={idx} tone="blue">{region}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {(r.regulationsHit || []).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {r.regulationsHit.map((regulation, idx) => (
                            <Badge key={idx} tone="yellow">{regulation}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {r.riskScore ? (
                        <RiskBadge risk={r.riskScore} />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {r.feedback?.vote ? (
                        <VoteBadge vote={r.feedback.vote} />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {!visible.length && (
            <div className="px-4 py-12 text-center">
              <div className="text-4xl mb-2">📋</div>
              <div className="text-gray-500 font-medium">No audit entries found</div>
              <div className="text-gray-400 text-sm mt-1">
                {q || region !== "all" || reg !== "all" 
                  ? "Try adjusting your filters" 
                  : "Audit entries will appear here as features are analyzed"}
              </div>
            </div>
          )}
        </div>

        {/* Show More/Less Button */}
        {totalEntries > initialLimit && (
          <div className="mt-4 flex justify-center">
            <Btn onClick={() => setShowAll(!showAll)} variant="secondary">
              {showAll 
                ? "Show less" 
                : `Show ${totalEntries - initialLimit} more entries`
              }
            </Btn>
          </div>
        )}

        {/* Footer Stats */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              Last updated: {new Date().toLocaleString()}
            </div>
            <div className="flex items-center gap-4">
              <span>Total audited features: {rows.length}</span>
              <span>•</span>
              <span>Compliance rate: {Math.round((rows.filter(r => r.feedback?.vote === 'Approved').length / rows.length) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}