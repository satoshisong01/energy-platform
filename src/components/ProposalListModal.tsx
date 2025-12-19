'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useProposalStore, ProposalMeta } from '../lib/store';
import {
  LucideX,
  LucideFileText,
  LucideTrash2,
  LucideLoader,
  LucidePen,
  LucideFolder,
  LucideFolderOpen,
  LucideChevronRight,
  LucideChevronDown,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

// 트리 노드 타입 정의
type TreeNode = {
  name: string;
  fullPath: string;
  isFolder: boolean;
  children: { [key: string]: TreeNode };
  data?: ProposalMeta;
};

export default function ProposalListModal({ isOpen, onClose }: Props) {
  // Store Functions
  const fetchProposalList = useProposalStore(
    (state) => state.fetchProposalList
  );
  const loadProposal = useProposalStore((state) => state.loadProposal);
  const deleteProposal = useProposalStore((state) => state.deleteProposal);
  const renameProposal = useProposalStore((state) => state.renameProposal);

  const [list, setList] = useState<ProposalMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  // 목록 불러오기
  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProposalList();
      setList(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [fetchProposalList]);

  useEffect(() => {
    if (isOpen) {
      loadList();
    }
  }, [isOpen, loadList]);

  // 폴더 토글
  const toggleFolder = (path: string) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(path)) newSet.delete(path);
    else newSet.add(path);
    setExpandedFolders(newSet);
  };

  // 데이터 -> 트리 변환 (useMemo)
  const tree = useMemo(() => {
    const root: TreeNode = {
      name: 'root',
      fullPath: '',
      isFolder: true,
      children: {},
    };
    list.forEach((item) => {
      const parts = item.proposal_name.split('/');
      let current = root;
      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        const path = parts.slice(0, index + 1).join('/');
        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            fullPath: path,
            isFolder: !isLast,
            children: {},
            data: isLast ? item : undefined,
          };
        }
        current = current.children[part];
      });
    });
    return root;
  }, [list]);

  // Actions
  const handleLoad = async (id: number) => {
    if (
      confirm('이 견적서를 불러오시겠습니까? \n(작성 중인 내용은 사라집니다)')
    ) {
      await loadProposal(id);
      onClose();
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (
      confirm('정말 삭제하시겠습니까? \n삭제된 데이터는 복구할 수 없습니다.')
    ) {
      await deleteProposal(id);
      loadList();
    }
  };

  const handleRename = async (e: React.MouseEvent, item: ProposalMeta) => {
    e.stopPropagation();
    const newName = prompt(
      '이름을 변경하거나 폴더를 지정하세요.\n(예: 폴더명/파일이름)',
      item.proposal_name
    );
    if (newName && newName.trim() !== '' && newName !== item.proposal_name) {
      const success = await renameProposal(item.id, newName.trim());
      if (success) loadList();
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(
      2,
      '0'
    )}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // --- 재귀 렌더링 컴포넌트 ---
  const renderTree = (node: TreeNode, depth: number = 0) => {
    const nodes = Object.values(node.children).sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {nodes.map((child) => {
          const isExpanded = expandedFolders.has(child.fullPath);
          const paddingLeft = depth * 20; // 깊이에 따른 들여쓰기

          if (child.isFolder) {
            // [폴더 디자인] - 심플하게 행으로 표현
            return (
              <div key={child.fullPath}>
                <div
                  onClick={() => toggleFolder(child.fullPath)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px',
                    marginLeft: `${paddingLeft}px`,
                    cursor: 'pointer',
                    color: '#475569',
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    userSelect: 'none',
                  }}
                >
                  <span style={{ marginRight: '6px' }}>
                    {isExpanded ? (
                      <LucideChevronDown size={16} />
                    ) : (
                      <LucideChevronRight size={16} />
                    )}
                  </span>
                  <span style={{ marginRight: '8px', color: '#f59e0b' }}>
                    {isExpanded ? (
                      <LucideFolderOpen size={20} />
                    ) : (
                      <LucideFolder size={20} />
                    )}
                  </span>
                  {child.name}
                </div>
                {/* 하위 내용 렌더링 */}
                {isExpanded && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    {renderTree(child, depth + 1)}
                  </div>
                )}
              </div>
            );
          } else {
            // [파일 디자인] - 사용자님이 원하시던 기존 Card 스타일 그대로 사용
            const item = child.data!;
            return (
              <div
                key={item.id}
                onClick={() => handleLoad(item.id)}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginLeft: `${paddingLeft}px`, // 들여쓰기 적용
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = '#3b82f6')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = '#e2e8f0')
                }
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 'bold',
                      color: '#1e293b',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <LucideFileText size={16} color="#3b82f6" />
                    {child.name} {/* 파일명만 표시 */}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    고객명: {item.client_name} <br />
                    수정일: {formatDate(item.updated_at || item.created_at)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* 수정 버튼 */}
                  <button
                    onClick={(e) => handleRename(e, item)}
                    style={{
                      padding: '8px',
                      background: '#f1f5f9',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#475569',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    title="이름 변경 / 폴더 이동"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = '#e2e8f0')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = '#f1f5f9')
                    }
                  >
                    <LucidePen size={18} />
                  </button>

                  {/* 삭제 버튼 */}
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    style={{
                      padding: '8px',
                      background: '#fee2e2',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#ef4444',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    title="삭제"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = '#fecaca')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = '#fee2e2')
                    }
                  >
                    <LucideTrash2 size={18} />
                  </button>
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '550px',
          maxWidth: '90%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: '#1e293b',
            }}
          >
            📂 분석자료 불러오기
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <LucideX size={24} color="#64748b" />
          </button>
        </div>

        {/* 안내 문구 (작게 추가) */}
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: '#eff6ff',
            fontSize: '0.8rem',
            color: '#1d4ed8',
            borderBottom: '1px solid #dbeafe',
          }}
        >
          💡 이름에 <b>/</b>를 넣으면 폴더가 생성됩니다. (예:{' '}
          <code>진행중/회사명</code>)
        </div>

        {/* 목록 영역 */}
        <div
          style={{
            padding: '20px',
            overflowY: 'auto',
            flex: 1,
            backgroundColor: '#f8fafc',
          }}
        >
          {loading ? (
            <div
              style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}
            >
              <LucideLoader
                className="animate-spin"
                style={{ display: 'inline-block', marginBottom: '10px' }}
              />
              <p>목록을 불러오는 중...</p>
            </div>
          ) : list.length === 0 ? (
            <div
              style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}
            >
              <p>저장된 견적서가 없습니다.</p>
            </div>
          ) : (
            renderTree(tree)
          )}
        </div>
      </div>
    </div>
  );
}
