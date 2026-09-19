/**
 * NEXRAFLOW AI - Traffic Science & Mathematical Calculus Engine
 * Implements:
 * 1. Indian Roads Congress (IRC:106) Passenger Car Unit (PCU) Standardization & LOS
 * 2. Lighthill-Whitham-Richards (LWR) Kinematic Shockwave Calculus
 * 3. Webster's Minimum Delay Signal Preemption (Signal Flush Calculus)
 * 4. 1D Recursive Kalman Denoising Filter for Sensor Dropout Resilience
 */

class TrafficMath {
    // IRC:106 Passenger Car Unit (PCU) Equivalency Factors
    static PCU_WEIGHTS = {
        twoWheeler: 0.5,    // Motorcycles, Scooters
        autoRickshaw: 1.2,  // 3-Wheelers
        car: 1.0,           // Sedans, SUVs, Cabs
        bus: 3.0            // Heavy TSRTC Buses, Multi-Axle Trucks
    };

    /**
     * Compute Total PCU/hr from classified vehicle counts
     * @param {Object} counts - { twoWheeler, autoRickshaw, car, bus } in vehicles/hr
     * @returns {Object} totalPCU, composition percentages, breakdown
     */
    static calculatePCU(counts) {
        const tw = counts.twoWheeler || 0;
        const auto = counts.autoRickshaw || 0;
        const car = counts.car || 0;
        const bus = counts.bus || 0;

        const totalVehicles = tw + auto + car + bus || 1;
        const pcuTotal = (tw * this.PCU_WEIGHTS.twoWheeler) +
                         (auto * this.PCU_WEIGHTS.autoRickshaw) +
                         (car * this.PCU_WEIGHTS.car) +
                         (bus * this.PCU_WEIGHTS.bus);

        return {
            totalPCU: Math.round(pcuTotal),
            totalVehicles: totalVehicles,
            composition: {
                twoWheelerPct: ((tw / totalVehicles) * 100).toFixed(1),
                autoRickshawPct: ((auto / totalVehicles) * 100).toFixed(1),
                carPct: ((car / totalVehicles) * 100).toFixed(1),
                busPct: ((bus / totalVehicles) * 100).toFixed(1)
            },
            pcuBreakdown: {
                twoWheelerPCU: Math.round(tw * this.PCU_WEIGHTS.twoWheeler),
                autoRickshawPCU: Math.round(auto * this.PCU_WEIGHTS.autoRickshaw),
                carPCU: Math.round(car * this.PCU_WEIGHTS.car),
                busPCU: Math.round(bus * this.PCU_WEIGHTS.bus)
            }
        };
    }

    /**
     * Determine Level of Service (LOS) and Volume-to-Capacity ratio (IRC:106 guidelines)
     * @param {number} flowPCU - Flow in PCU/hr
     * @param {number} capacityPCU - Design corridor capacity in PCU/hr (e.g., 3-lane 3800 PCU/h)
     */
    static calculateLOS(flowPCU, capacityPCU = 3800) {
        const vcRatio = capacityPCU > 0 ? (flowPCU / capacityPCU) : 1.0;
        let los = 'A';
        let status = 'Free Flow';
        let color = '#10b981'; // Emerald

        if (vcRatio <= 0.40) {
            los = 'A';
            status = 'Free Flow (Nominal)';
            color = '#10b981';
        } else if (vcRatio <= 0.60) {
            los = 'B';
            status = 'Stable Flow';
            color = '#34d399';
        } else if (vcRatio <= 0.75) {
            los = 'C';
            status = 'Dense Arterial Flow';
            color = '#fbbf24';
        } else if (vcRatio <= 0.88) {
            los = 'D';
            status = 'Approaching Capacity';
            color = '#f59e0b';
        } else if (vcRatio <= 1.00) {
            los = 'E';
            status = 'Unstable / Bottleneck Threshold';
            color = '#f97316';
        } else {
            los = 'F';
            status = 'Kinematic Breakdown / Spillback Gridlock';
            color = '#ef4444';
        }

        return {
            vcRatio: parseFloat(vcRatio.toFixed(3)),
            los: los,
            status: status,
            color: color
        };
    }

    /**
     * Lighthill-Whitham-Richards (LWR) Shockwave Kinematic Calculus
     * Computes shockwave propagation velocity: w = (q_B - q_A) / (k_B - k_A)
     * 
     * @param {number} qA - Upstream arrival flow rate (PCU/h)
     * @param {number} kA - Upstream density (PCU/km)
     * @param {number} qB - Bottleneck discharge capacity (PCU/h)
     * @param {number} kB - Congested queue density (PCU/km)
     * @param {number} upstreamDistanceKm - Distance to upstream junction (e.g. 1.8 km to Cyber Towers)
     */
    static calculateShockwave(qA, kA, qB, kB, upstreamDistanceKm = 1.8) {
        const deltaQ = qB - qA; // PCU/hr
        const deltaK = kB - kA; // PCU/km

        // Shockwave speed in km/h
        const w = Math.abs(deltaK) > 0.1 ? (deltaQ / deltaK) : 0;

        // Is it backward-propagating (spillback toward upstream)?
        const isSpillback = w < 0;
        const absSpeed = Math.abs(w);

        // Time to spillback reaching upstream junction
        let arrivalMinutes = 999;
        if (isSpillback && absSpeed > 0.5) {
            arrivalMinutes = (upstreamDistanceKm / absSpeed) * 60;
        }

        // Queue growth rate in PCU/min
        const queueGrowthPCUPerMin = Math.max(0, (qA - qB) / 60);

        return {
            velocityKmh: parseFloat(w.toFixed(2)),
            absSpeedKmh: parseFloat(absSpeed.toFixed(2)),
            isSpillback: isSpillback,
            arrivalMinutes: parseFloat(arrivalMinutes.toFixed(1)),
            arrivalSeconds: Math.round(arrivalMinutes * 60),
            queueGrowthPCUPerMin: parseFloat(queueGrowthPCUPerMin.toFixed(1)),
            deltaQ: Math.round(deltaQ),
            deltaK: Math.round(deltaK)
        };
    }

    /**
     * Webster's Minimum Delay Signal Preemption ("Signal Flush")
     * Delta_g = Q_accumulated / (s * N_open_lanes)
     * 
     * @param {number} queuePCU - Accumulated queue in PCU
     * @param {number} saturationFlowPerLane - Saturation flow rate (default 1800 PCU/h/lane)
     * @param {number} openLanes - Open lanes available (default 2 lanes during incident)
     * @param {number} nominalCycle - Base cycle length in seconds (default 90s)
     * @param {number} baseGreen - Base arterial green time in seconds (default 45s)
     */
    static calculateSignalFlush(queuePCU, saturationFlowPerLane = 1800, openLanes = 2, nominalCycle = 90, baseGreen = 45) {
        // Saturation rate in PCU per second for all open lanes
        const sTotalPerSecond = (saturationFlowPerLane * openLanes) / 3600;

        // Green extension required in seconds to flush queue
        const deltaGreen = sTotalPerSecond > 0 ? (queuePCU / sTotalPerSecond) : 0;
        const cappedDeltaGreen = Math.min(35, Math.max(0, Math.round(deltaGreen))); // Clamp to +35s max

        const preemptedGreen = Math.min(80, baseGreen + (cappedDeltaGreen > 0 ? cappedDeltaGreen : 25));
        const preemptedCrossStreet = Math.max(15, nominalCycle - preemptedGreen);

        const standardSplit = `${baseGreen}/${nominalCycle - baseGreen}`;
        const activeSplit = `${preemptedGreen}/${preemptedCrossStreet}`;
        const purgeThroughputPCUPerHour = Math.round(sTotalPerSecond * 3600);

        return {
            deltaGreenSeconds: cappedDeltaGreen || 25,
            preemptedGreenSeconds: preemptedGreen,
            preemptedCrossStreetSeconds: preemptedCrossStreet,
            nominalCycleSeconds: nominalCycle,
            standardSplit: standardSplit,
            activeSplit: activeSplit,
            purgeThroughputPCU: purgeThroughputPCUPerHour,
            isPreempted: cappedDeltaGreen > 0 || preemptedGreen > baseGreen
        };
    }
}

/**
 * 1D Recursive Kalman Filter for Roadside Sensor Denoising & Packet Dropout Absorption
 * Formulated to absorb up to 30% roadside sensor dropouts and weather radar jitter.
 */
class KalmanDenoisingFilter {
    /**
     * @param {number} processNoiseQ - Process variance (Q) - default 0.05
     * @param {number} measurementNoiseR - Sensor measurement noise (R) - default 4.0
     * @param {number} initialEstimate - Initial state value (e.g. 45 km/h)
     */
    constructor(processNoiseQ = 0.05, measurementNoiseR = 4.0, initialEstimate = 45) {
        this.Q = processNoiseQ;
        this.R = measurementNoiseR;
        this.x = initialEstimate; // State estimate
        this.P = 1.0;            // Error covariance
        this.dropoutCounter = 0;
    }

    /**
     * Update state with a new measurement (or handle dropout)
     * @param {number|null} measurement - Measured value or null if packet was dropped
     * @returns {Object} { estimate, raw, isDropout, gain }
     */
    update(measurement) {
        // 1. Time Update (Predict)
        const x_pred = this.x;
        const P_pred = this.P + this.Q;

        // Check for packet drop / NaN
        if (measurement === null || measurement === undefined || isNaN(measurement)) {
            this.dropoutCounter++;
            this.x = x_pred; // Extrapolate prior state
            this.P = P_pred;
            return {
                estimate: parseFloat(this.x.toFixed(2)),
                raw: null,
                isDropout: true,
                gain: 0,
                dropoutCounter: this.dropoutCounter
            };
        }

        // 2. Measurement Update (Correct)
        const K = P_pred / (P_pred + this.R); // Kalman Gain
        this.x = x_pred + K * (measurement - x_pred);
        this.P = (1 - K) * P_pred;

        return {
            estimate: parseFloat(this.x.toFixed(2)),
            raw: parseFloat(measurement.toFixed(2)),
            isDropout: false,
            gain: parseFloat(K.toFixed(4)),
            dropoutCounter: this.dropoutCounter
        };
    }

    reset(newInitial = 45) {
        this.x = newInitial;
        this.P = 1.0;
        this.dropoutCounter = 0;
    }
}

// Export to window
window.TrafficMath = TrafficMath;
window.KalmanDenoisingFilter = KalmanDenoisingFilter;
