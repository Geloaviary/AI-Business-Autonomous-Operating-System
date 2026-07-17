'use client';

/**
 * components/DepartmentCreator.tsx
 * ---------------------------------------------------------------------------
 * Button 2 of the department-creation flow. A dropdown of departments the
 * business doesn't have yet (from KNOWN_DEPARTMENTS — the same list the
 * sidebar's org chart uses, so the two stay in sync) plus a prompt box
 * that Prompt Creator can pre-fill. "Create Department" submits straight
 * to Engineering; the result stops at CERTIFIED/COMMITTED and moves to
 * Pending Activation — it does not go live until the executive approves it.
 * ---------------------------------------------------------------------------
 */

import { useEffect, useState } from 'react';
import PromptCreatorModal from './PromptCreatorModal';
import { KNOWN_DEPARTMENTS, departmentsByCategory, PromptCreatorResult } from '../lib/types';

const GROUPED = departmentsByCategory();
const FIRST_DEPARTMENT = GROUPED[0]?.departments[0]?.name || 'custom';

export default function DepartmentCreator({
  onSubmit,
  isRunning
}: {
  onSubmit: (spec: { businessObjective: string; capabilities: string[]; targetDepartmentName?: string }) => void;
  isRunning: boolean;
}) {
  const [selected, setSelected] = useState<string>(FIRST_DEPARTMENT);
  const [objective, setObjective] = useState('');
  const [capabilities, setCapabilities] = useState('');

  useEffect(() => {
    const prefill = sessionStorage.getItem('baos:prefill');
    if (prefill) {
      setObjective(prefill);
      sessionStorage.removeItem('baos:prefill');
    }
  }, []);

  function handleDropdownChange(name: string) {
    setSelected(name);
    if (name !== 'custom') {
      const dept = KNOWN_DEPARTMENTS.find((d) => d.name === name);
      if (dept && !objective.trim()) {
        setObjective(`Create a ${dept.title} Department.`);
      }
    }
  }

  function handlePromptCreatorResult(result: PromptCreatorResult) {
    setObjective(result.businessObjective);
    setCapabilities(result.capabilities.join(', '));
    setSelected('custom');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!objective.trim()) return;
    onSubmit({
      businessObjective: objective.trim(),
      capabilities: capabilities.split(',').map((c) => c.trim()).filter(Boolean),
      targetDepartmentName: selected !== 'custom' ? selected : undefined
    });
  }

  return (
    <form onSubmit={handleSubmit} className="panel p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="panel-title !mb-0">Create a Department</div>
        <PromptCreatorModal onUse={handlePromptCreatorResult} />
      </div>

      <label className="block text-[12px] text-ink-muted mb-1.5">
        Department <span className="text-ink-faint">({KNOWN_DEPARTMENTS.filter((d) => d.status === 'NOT_CREATED').length} available)</span>
      </label>
      <select
        className="input-field mb-3"
        value={selected}
        onChange={(e) => handleDropdownChange(e.target.value)}
      >
        {GROUPED.map((group) => (
          <optgroup key={group.category} label={group.category}>
            {group.departments.map((dept) => (
              <option key={dept.name} value={dept.name}>{dept.title}</option>
            ))}
          </optgroup>
        ))}
        <option value="custom">Custom department…</option>
      </select>

      <label className="block text-[12px] text-ink-muted mb-1.5">Business Objective</label>
      <textarea
        className="input-field"
        rows={2}
        placeholder='e.g. "Create a Research Department to analyze the Japanese market."'
        value={objective}
        onChange={(e) => setObjective(e.target.value)}
      />

      <label className="block text-[12px] text-ink-muted mb-1.5 mt-3">Capabilities (comma-separated)</label>
      <input
        className="input-field"
        placeholder="Market research, Competitor research, Trend analysis"
        value={capabilities}
        onChange={(e) => setCapabilities(e.target.value)}
      />

      <button type="submit" className="btn-primary mt-4" disabled={isRunning || !objective.trim()}>
        {isRunning ? 'Engineering is working…' : 'Create Department'}
      </button>
      <p className="text-[11px] text-ink-faint mt-2.5">
        Engineering will build, validate, and certify this department. It won't go live until you activate it.
      </p>
    </form>
  );
}
