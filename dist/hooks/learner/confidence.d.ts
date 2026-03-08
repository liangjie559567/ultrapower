/**
 * confidence.ts — 置信度衰减引擎
 *
 * 从 Axiom confidence.py 移植。管理知识条目的置信度分数生命周期。
 */
import type { AxiomConfig } from '../../config/axiom-config.js';
export interface ConfidenceAdjustment {
    id: string;
    oldConfidence: number;
    newConfidence: number;
    deprecated: boolean;
}
export declare class ConfidenceEngine {
    private readonly knowledgeDir;
    private readonly config;
    static readonly VERIFY_BOOST = 0.1;
    static readonly REFERENCE_BOOST = 0.05;
    static readonly MISLEADING_PENALTY = -0.2;
    static readonly UNUSED_DECAY = -0.1;
    constructor(baseDir?: string, config?: Partial<AxiomConfig['evolution']>);
    onVerified(kid: string): Promise<number | null>;
    onReferenced(kid: string): Promise<number | null>;
    onMisleading(kid: string): Promise<number | null>;
    decayUnused(days?: number): Promise<ConfidenceAdjustment[]>;
    /** 获取置信度低于阈值的条目（对齐 Python get_deprecated） */
    getDeprecated(): Promise<ConfidenceAdjustment[]>;
    getConfidence(kid: string): Promise<number | null>;
    private adjust;
}
import type { KnowledgeUnit } from './types.js';
/**
 * Decay confidence of a KnowledgeUnit if last_used is >= decayDays ago.
 * @param unit - The knowledge unit to potentially decay
 * @param decayDays - Days threshold (default 30)
 * @param decayFactor - Multiplier applied when decaying (default 0.9)
 * @param minConfidence - Floor value (default 0.1)
 * @param nowMs - Current time in ms (injectable for testing)
 */
export declare function decayConfidence(unit: KnowledgeUnit, decayDays?: number, decayFactor?: number, minConfidence?: number, nowMs?: number): KnowledgeUnit;
//# sourceMappingURL=confidence.d.ts.map