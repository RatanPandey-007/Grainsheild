import numpy as np
from datetime import datetime
from typing import List, Dict, Any, Tuple
import os
import pickle

# Attempt to import scikit-learn. If not available, we use our mathematical heuristic fallback
try:
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.preprocessing import LabelEncoder
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

class SpoilagePredictor:
    def __init__(self):
        self.model = None
        self.encoder = None
        self.model_path = os.path.join(os.path.dirname(__file__), "spoilage_model.pkl")
        self._initialize_model()

    def _generate_synthetic_data(self) -> Tuple[np.ndarray, np.ndarray]:
        """
        Generates synthetic grain storage readings and calculates risk percentage.
        Features: Temperature, Humidity, Moisture, Gas, ExposureDays, GrainType_Encoded
        """
        np.random.seed(42)
        n_samples = 1500

        # Features
        temp = np.random.uniform(10, 45, n_samples)       # 10 to 45 °C
        humidity = np.random.uniform(40, 95, n_samples)   # 40 to 95 %
        moisture = np.random.uniform(8, 25, n_samples)     # 8 to 25 %
        gas = np.random.uniform(350, 1500, n_samples)      # 350 to 1500 PPM
        exposure = np.random.uniform(1, 30, n_samples)     # 1 to 30 days
        grain_type = np.random.choice([0, 1, 2, 3], n_samples) # 0: RICE, 1: WHEAT, 2: MAIZE, 3: PULSES

        # Risk calculation logic (scientific proxy formulas)
        # Safe levels:
        # Temp <= 25, Humid <= 65, Moisture <= 13, Gas <= 450
        risk = []
        for i in range(n_samples):
            r = 0.0
            
            # Base risks depending on grain type thresholds
            # Pulses are very sensitive (moisture threshold ~12%), wheat/rice/maize (~13-14%)
            m_thresh = 13.5
            if grain_type[i] == 3: # PULSES
                m_thresh = 12.0
            elif grain_type[i] == 1: # WHEAT
                m_thresh = 14.0
            elif grain_type[i] == 2: # MAIZE
                m_thresh = 13.0

            # 1. Moisture impact (High weight)
            if moisture[i] > m_thresh:
                r += (moisture[i] - m_thresh) * 12.0
            else:
                r += (moisture[i] / m_thresh) * 5.0
            
            # 2. Humidity impact
            if humidity[i] > 70.0:
                r += (humidity[i] - 70.0) * 1.2
            else:
                r += (humidity[i] / 70.0) * 3.0

            # 3. Temperature impact
            if temp[i] > 25.0:
                r += (temp[i] - 25.0) * 1.5
            else:
                r += (temp[i] / 25.0) * 2.0

            # 4. Gas buildup (CO2/Respiration proxy)
            if gas[i] > 600.0:
                r += (gas[i] - 600.0) * 0.03
            else:
                r += (gas[i] / 600.0) * 2.0

            # 5. Exposure multiplier
            r *= (1.0 + (exposure[i] / 60.0))

            # Bound risk between 0 and 100
            r = min(max(r, 0.0), 100.0)
            risk.append(r)

        X = np.column_stack((temp, humidity, moisture, gas, exposure, grain_type))
        y = np.array(risk)
        return X, y

    def _initialize_model(self):
        """
        Train the model using Scikit-Learn if available, otherwise log heuristic usage.
        """
        if not SKLEARN_AVAILABLE:
            print("WARNING: scikit-learn is not installed. Using mathematical heuristic fallback model.")
            return

        try:
            if os.path.exists(self.model_path):
                with open(self.model_path, "rb") as f:
                    self.model = pickle.load(f)
                print("ML Engine: Loaded pre-trained model.")
                return

            print("ML Engine: Training synthetic model on startup...")
            X, y = self._generate_synthetic_data()
            self.model = RandomForestRegressor(n_estimators=50, random_state=42, n_jobs=-1)
            self.model.fit(X, y)
            
            with open(self.model_path, "wb") as f:
                pickle.dump(self.model, f)
            print("ML Engine: Model training complete and saved.")
        except Exception as e:
            print(f"Error training ML model: {e}. Falling back to heuristics.")
            self.model = None

    def predict_risk(self, temp: float, humidity: float, moisture: float, gas: float, exposure_days: float, grain_type: str) -> Dict[str, Any]:
        """
        Predicts the risk percentage and determines the risk category, contributing factors,
        and recommendations.
        """
        grain_mapping = {"RICE": 0, "WHEAT": 1, "MAIZE": 2, "PULSES": 3}
        grain_encoded = grain_mapping.get(grain_type.upper(), 0)

        # 1. Calculate score (ML or Fallback Heuristics)
        score = 0.0
        if SKLEARN_AVAILABLE and self.model is not None:
            input_features = np.array([[temp, humidity, moisture, gas, exposure_days, grain_encoded]])
            score = float(self.model.predict(input_features)[0])
        else:
            # Mathematical heuristic model (exact mirror of training logic)
            m_thresh = 13.5
            if grain_encoded == 3: # PULSES
                m_thresh = 12.0
            elif grain_encoded == 1: # WHEAT
                m_thresh = 14.0
            elif grain_encoded == 2: # MAIZE
                m_thresh = 13.0

            r = 0.0
            if moisture > m_thresh:
                r += (moisture - m_thresh) * 12.0
            else:
                r += (moisture / m_thresh) * 5.0
            
            if humidity > 70.0:
                r += (humidity - 70.0) * 1.2
            else:
                r += (humidity / 70.0) * 3.0

            if temp > 25.0:
                r += (temp - 25.0) * 1.5
            else:
                r += (temp / 25.0) * 2.0

            if gas > 600.0:
                r += (gas - 600.0) * 0.03
            else:
                r += (gas / 600.0) * 2.0

            r *= (1.0 + (exposure_days / 60.0))
            score = min(max(r, 0.0), 100.0)

        # 2. Determine risk category
        if score < 30.0:
            category = "NORMAL"
        elif score < 70.0:
            category = "WARNING"
        else:
            category = "CRITICAL"

        # 3. Identify contributing factors
        factors = []
        m_thresh = 12.0 if grain_type.upper() == "PULSES" else 13.5
        if moisture > m_thresh:
            factors.append(f"High Grain Moisture ({moisture:.1f}% > {m_thresh:.1f}% threshold)")
        if humidity > 70.0:
            factors.append(f"High Ambient Humidity ({humidity:.1f}% > 70.0% threshold)")
        if temp > 28.0:
            factors.append(f"High Warehouse Temperature ({temp:.1f}°C)")
        if gas > 650.0:
            factors.append(f"Elevated Respiration Gas Levels ({gas:.0f} PPM)")
        if exposure_days > 15:
            factors.append(f"Prolonged Storage Exposure ({exposure_days:.0f} days)")

        if not factors:
            factors.append("Atmospheric readings are within optimal specifications.")

        # 4. Generate recommendations
        recommendations = {
            "NORMAL": "No action required. Maintain scheduled atmospheric monitoring.",
            "WARNING": "Action Advised: Initiate aeration fans to reduce humidity and lower internal temperature.",
            "CRITICAL": "CRITICAL ACTION REQUIRED: Deploy localized ventilation immediately. Conduct physical inspection of the batch for early spoilage signs. Prepare for grain drying or immediate transfer."
        }

        return {
            "risk_score": round(score, 1),
            "risk_category": category,
            "contributing_factors": factors,
            "recommended_action": recommendations[category],
            "timestamp": datetime.utcnow()
        }

predictor = SpoilagePredictor()
