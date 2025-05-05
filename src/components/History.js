import React from 'react';

function History({ historyList, handleSearch }) {
  if (!historyList || historyList.length === 0) return null;
  return (
    <div className="history-container">
      <h3>Recent Searches</h3>
      <div>
        {historyList.map((h) => (
          <button key={h} type="button" onClick={() => handleSearch(h)}>
            {h}
          </button>
        ))}
      </div>
    </div>
  );
}

export default History;