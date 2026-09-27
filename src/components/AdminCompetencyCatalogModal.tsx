/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Plus, 
  Edit3, 
  Check, 
  X, 
  Power, 
  AlertCircle, 
  Tag, 
  FileText 
} from 'lucide-react';
import { CatalogCompetency, CompetencyCategory } from '../types';
import { Button, Card, Badge, Input } from './bauhaus';

interface AdminCompetencyCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: CatalogCompetency[];
  onUpdateCatalog: (newCatalog: CatalogCompetency[]) => void;
}

const CATEGORIES: CompetencyCategory[] = [
  'Technical',
  'Professional',
  'Communication',
  'Leadership',
  'Management',
  'Digital',
  'Domain Specific'
];

export default function AdminCompetencyCatalogModal({
  isOpen,
  onClose,
  catalog,
  onUpdateCatalog
}: AdminCompetencyCatalogModalProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'edit'>('list');
  const [editingComp, setEditingComp] = useState<CatalogCompetency | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CompetencyCategory>('Technical');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setName('');
    setCategory('Technical');
    setDescription('');
    setEditingComp(null);
    setError(null);
    setActiveTab('add');
  };

  const handleStartEdit = (comp: CatalogCompetency) => {
    setEditingComp(comp);
    setName(comp.name);
    setCategory(comp.category);
    setDescription(comp.description);
    setError(null);
    setActiveTab('edit');
  };

  const handleSaveComp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      setError('Competency Name and Description are required.');
      return;
    }

    if (activeTab === 'add') {
      // Check for duplicate name
      if (catalog.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
        setError('A competency with this name already exists in the catalog.');
        return;
      }
      const newComp: CatalogCompetency = {
        id: `cat-comp-${Date.now()}`,
        name: name.trim(),
        category,
        description: description.trim(),
        isActive: true
      };
      onUpdateCatalog([...catalog, newComp]);
    } else if (activeTab === 'edit' && editingComp) {
      const updated = catalog.map(c => 
        c.id === editingComp.id 
          ? { ...c, name: name.trim(), category, description: description.trim() } 
          : c
      );
      onUpdateCatalog(updated);
    }

    setActiveTab('list');
    setError(null);
  };

  const handleToggleActive = (id: string) => {
    const updated = catalog.map(c => 
      c.id === id ? { ...c, isActive: !c.isActive } : c
    );
    onUpdateCatalog(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#111111]/70 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
      <div className="bg-[var(--card-bg)] text-[var(--text-primary)] border-2 border-[var(--border-main)] rounded-[6px] shadow-paper-lg w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 md:p-5 border-b-2 border-[var(--border-main)] bg-[var(--bg-main)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-[#FF9800]" />
            <div>
              <h3 className="font-heading font-extrabold text-base md:text-lg uppercase">
                ADMIN COMPETENCY CATALOG MANAGER
              </h3>
              <p className="text-[11px] font-mono text-[var(--text-secondary)]">
                Centralized Organization Competency Framework ({catalog.length} Total Competencies)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[4px] border-2 border-[var(--border-main)] hover:bg-[#FF4D4D] hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-4 flex-1">
          
          {error && (
            <div className="rounded-[4px] bg-[#FF4D4D]/10 border-2 border-[#FF4D4D] p-3 flex items-start gap-2 text-xs text-[#FF4D4D] font-mono font-bold">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'list' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-bold uppercase text-[var(--text-secondary)]">Catalog Items</h4>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleStartAdd}
                  icon={<Plus className="h-3.5 w-3.5" />}
                  className="bg-[#FFC400]"
                >
                  Create Competency
                </Button>
              </div>

              <div className="space-y-2.5">
                {catalog.map((comp) => (
                  <div
                    key={comp.id}
                    className={`p-3.5 rounded-[6px] border-2 border-[var(--border-main)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-paper-xs transition-opacity ${
                      comp.isActive ? 'bg-[var(--bg-main)]' : 'bg-gray-100 dark:bg-neutral-900 opacity-60'
                    }`}
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-extrabold text-sm uppercase">{comp.name}</span>
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border border-[var(--border-main)] bg-[var(--card-bg)]">
                          {comp.category}
                        </span>
                        {!comp.isActive && (
                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-[var(--text-secondary)] leading-relaxed">
                        {comp.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Button
                        variant="tertiary"
                        size="sm"
                        onClick={() => handleStartEdit(comp)}
                        icon={<Edit3 className="h-3.5 w-3.5" />}
                      >
                        Edit
                      </Button>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(comp.id)}
                        className={`p-2 rounded-[4px] border-2 border-[var(--border-main)] text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                          comp.isActive 
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-200' 
                            : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-200'
                        }`}
                        title={comp.isActive ? "Deactivate competency" : "Activate competency"}
                      >
                        <Power className="h-3.5 w-3.5" />
                        <span>{comp.isActive ? 'Deactivate' : 'Activate'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveComp} className="space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase text-[var(--text-primary)]">
                {activeTab === 'add' ? 'Create New Catalog Competency' : `Edit Competency: ${editingComp?.name}`}
              </h4>

              <div className="space-y-3">
                <Input
                  label="COMPETENCY NAME *"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cloud Architecture, Data Privacy"
                />

                <div className="space-y-1.5">
                  <label className="section-label text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[1px]">
                    CATEGORY *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as CompetencyCategory)}
                    className="w-full rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] p-2.5 text-xs font-mono font-bold text-[var(--text-primary)] outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="section-label text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[1px]">
                    DESCRIPTION *
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the scope and expectation of this competency..."
                    className="w-full rounded-[6px] border-2 border-[var(--border-main)] bg-[var(--bg-main)] p-2.5 text-xs font-sans text-[var(--text-primary)] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border-main)]">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('list')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  className="bg-[#FFC400]"
                  icon={<Check className="h-3.5 w-3.5" />}
                >
                  Save to Catalog
                </Button>
              </div>
            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t-2 border-[var(--border-main)] bg-[var(--bg-main)] flex justify-end">
          <Button
            variant="tertiary"
            size="sm"
            onClick={onClose}
          >
            Close Catalog
          </Button>
        </div>

      </div>
    </div>
  );
}
