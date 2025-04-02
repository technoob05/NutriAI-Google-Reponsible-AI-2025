export const UI_TEMPLATES = {
  mealCard: `
    <div class="meal-card">
      <div class="meal-image">
        <img src="{imageUrl}" loading="lazy" />
        <div class="meal-quick-actions">
          {quickActions}
        </div>
      </div>
      
      <div class="meal-content">
        <h3>{name}</h3>
        <div class="meal-stats">
          {nutritionStats}
        </div>
        
        <div class="meal-details">
          {expandedContent}  
        </div>
      </div>
    </div>
  `,

  nutritionChart: `
    <div class="nutrition-chart">
      <div class="chart-header">
        {title}
      </div>
      <div class="chart-content">
        {chartBars}
      </div>
      <div class="chart-legend">
        {legend}  
      </div>
    </div>
  `,

  // Add more templates...
}

export const ANIMATION_PRESETS = {
  fadeIn: {
    keyframes: `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `,
    className: 'animate-fade-in'
  },
  
  slideUp: {
    keyframes: `
      @keyframes slideUp {
        from { 
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1; 
          transform: translateY(0);
        }
      }
    `,
    className: 'animate-slide-up'
  },
  
  // Add more animations...
}
