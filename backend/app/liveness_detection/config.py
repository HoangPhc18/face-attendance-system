# Liveness detection configuration
import os

class LivenessConfig:
    # Thresholds for liveness detection
    EYE_AR_THRESH = 0.25  # Eye aspect ratio threshold for blink detection
    EYE_AR_CONSEC_FRAMES = 3  # Consecutive frames below threshold to register blink
    
    # Head movement thresholds
    HEAD_MOVEMENT_THRESH = 15.0  # Degrees of head movement required
    
    # Liveness scoring
    MIN_LIVENESS_SCORE = 0.6  # Minimum score to pass liveness test
    
    # Frame analysis settings
    MIN_FRAMES_FOR_ANALYSIS = 3  # Minimum frames needed for multi-frame analysis
    MAX_FRAMES_FOR_ANALYSIS = 10  # Maximum frames to analyze
    
    # Model paths
    SHAPE_PREDICTOR_PATH = os.path.join(
        os.path.dirname(__file__), 
        'models', 
        'shape_predictor_68_face_landmarks.dat'
    )
    
    # Feature weights for liveness scoring
    BLINK_WEIGHT = 0.4
    HEAD_MOVEMENT_WEIGHT = 0.6
    
    # Debugging
    DEBUG_MODE = False
    SAVE_DEBUG_IMAGES = False
    DEBUG_OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'debug_output')

# Environment-based configuration overrides
def get_liveness_config():
    config = LivenessConfig()
    
    # Override from environment variables if available
    config.EYE_AR_THRESH = float(os.getenv('LIVENESS_EYE_AR_THRESH', config.EYE_AR_THRESH))
    config.MIN_LIVENESS_SCORE = float(os.getenv('LIVENESS_MIN_SCORE', config.MIN_LIVENESS_SCORE))
    config.DEBUG_MODE = os.getenv('LIVENESS_DEBUG', 'false').lower() == 'true'
    
    return config
