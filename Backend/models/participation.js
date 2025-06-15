participations: [{
    collaborator: { 
      type: Schema.Types.ObjectId, 
      ref: 'Collaborator', // ou 'User' si vous préférez
      required: true 
    },
    TotalScore: {
      type: Number,
      required: true
    },
    successRate: {
      type: Number,
      required: true
    },
    startTime: 
    { type: Date, 
      required: true 
    },
    endTime: 
    { type: Date },

    timeSpent: 
    { type: Number },
    
    
  }]
  