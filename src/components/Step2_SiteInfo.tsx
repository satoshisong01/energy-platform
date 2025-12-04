"use client";
import { useProposalStore } from "../../src/lib/store";
import { LucidePlus, LucideTrash2 } from "lucide-react";
import styles from "@/app/page.module.css";

export default function Step2_SiteInfo() {
  const store = useProposalStore();
  return (
    <div>
      <div className={styles.roofHeader}>
        <h3 className={styles.sectionTitle} style={{margin:0}}><span className={styles.stepBadge}>2</span> 설치 공간</h3>
        <button onClick={store.addRoofArea} className={styles.addButton}><LucidePlus size={14}/> 추가</button>
      </div>
      {store.roofAreas.map((area, index) => (
        <div key={area.id} className={styles.roofItem}>
          <div className={styles.roofIndex}>{index + 1}</div>
          <input type="text" placeholder="구역명" className={styles.inputBare} value={area.name} onChange={(e) => store.updateRoofArea(area.id, 'name', e.target.value)} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', width: '120px' }}>
            <input type="number" className={styles.inputBare} style={{ textAlign: 'right' }} value={area.valueM2 || ''} onChange={(e) => store.updateRoofArea(area.id, 'valueM2', Number(e.target.value))} />
            <span className={styles.roofUnit}>m²</span>
          </div>
          {store.roofAreas.length > 1 && (
            <button onClick={() => store.removeRoofArea(area.id)} className={styles.deleteButton}><LucideTrash2 size={16} /></button>
          )}
        </div>
      ))}
      <div className={styles.summaryBadge}>
        <div><div className={styles.summaryLabel}>전체 평수</div><div className={styles.summaryValue}>{store.totalAreaPyeong.toLocaleString()} <span className={styles.summaryUnit}>평</span></div></div>
        <div style={{ textAlign: 'right', borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '1rem' }}>
           <div className={styles.summaryLabel}>설치 용량</div><div className={styles.summaryValue}>{store.capacityKw.toLocaleString()} <span className={styles.summaryUnit}>kW</span></div>
        </div>
      </div>
    </div>
  );
}