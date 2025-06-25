import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonIcon, IonButton} from '@ionic/angular/standalone';
import { Chart, registerables } from 'chart.js';
import { Firestore, collectionData, collection, getDocs } from '@angular/fire/firestore';
import { NavController } from '@ionic/angular';

Chart.register(...registerables);
interface Comentario {
  nombre: string;
  apellido: string;
  comentarios: string;
}

@Component({
  selector: 'app-resultados-encuestas',
  templateUrl: './resultados-encuestas.page.html',
  styleUrls: ['./resultados-encuestas.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonButtons, IonIcon, IonButton]
})
export class ResultadosEncuestasPage implements OnInit {


  comentarios: Comentario[] = []; 
  constructor(private firestore: Firestore, private navCtrl: NavController) {}

  ngOnInit() {
    this.loadSurveyData();
  }



  private async loadSurveyData(): Promise<void> {
    const encuestasRef = collection(this.firestore, 'encuestas'); // Trae los resultados de encuestas de CLIENTES
    try {
      const snapshot = await getDocs(encuestasRef);
      const data = snapshot.docs.map(doc => doc.data());
      
      this.renderCharts(data);
      
      this.comentarios = data
        .filter(d => d['comentarios'])
        .map(d => ({
          nombre: d['nombre'] || 'Anónimo',
          apellido: d['apellido'] || '',
          comentarios: d['comentarios'] || ''
        }));
    } catch (error) {
      console.error("Error al cargar los datos de encuestas:", error);
    }
  }

  private renderCharts(data: any[]) {

    // Extract data for each chart
    const satisfaccionPromedio = this.getSatisfaccionPromedio(data);
    const serviceRatings = data.map(d => d.calificacion);
    const highlightedAspects = this.getAspectCounts(data);
    const recommendationCounts = this.getRecommendationCounts(data);
  
    // Satisfaction Chart
    new Chart("satisfaccionChart", {
      type: 'bar',
      data: {
        labels: ['Satisfacción General'],
        datasets: [{
          label: 'Promedio de Satisfacción',
          data: [satisfaccionPromedio],
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: '#000000', // Color de los textos del eje Y
              font: {
                size:15,
                family:'LoveYaLikeASister'
              }
            }
          },
          x: {
            ticks: {
              color: '#000000', // Color de los textos del eje X
              font: {
                size:17,
                family:'LoveYaLikeASister'
              }
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#000000', // Color del texto de la leyenda
              font: {
                size:17,
                family:'LoveYaLikeASister'
              }
            }
          },
          title: {
            display: true,
            text: 'Promedio de Satisfacción',
            color: '#000000', // Color del título del gráfico
            font: {
              size:17,
              family:'LoveYaLikeASister'
            }
          }
        }
      }
    });
  
    // Service Rating Chart
    new Chart('serviceRatingChart', {
      type: 'bar',
      data: {
        labels: ['Excelente', 'Bueno', 'Regular', 'Malo'],
        datasets: [{
          data: this.countOccurrences(serviceRatings, ['Excelente', 'Bueno', 'Regular', 'Malo']),
          backgroundColor: ['#4caf50', '#ffeb3b', '#ff9800', '#f44336'],
          label: 'Calificación de la comida'
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#000000', // Color de los textos del eje Y
              font: {
                size:17,
                family:'LoveYaLikeASister'
              }
            }
          },
          x: {
            ticks: {
              color: '#000000', // Color de los textos del eje X
              font: {
                size:15,
                family:'LoveYaLikeASister'
              }
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#000000', // Color del texto de la leyenda
              font: {
                size:17,
                family:'LoveYaLikeASister'
              }
            }
          },
          title: {
            display: true,
            text: 'Calificación del Servicio',
            color: '#000000', // Color del título del gráfico
            font: {
              size:17,
              family:'LoveYaLikeASister'
            }
          }
        }
      }
    });
  
    // Aspects Highlighted Chart
    new Chart('aspectsChart', {
      type: 'pie',
      data: {
        labels: ['Comida', 'Limpieza', 'Ambiente', 'Atención al cliente'],
        datasets: [{
          data: [highlightedAspects['comida'], highlightedAspects['limpieza'], highlightedAspects['ambiente'], highlightedAspects['atencionAlCliente']],
          backgroundColor: ['#4caf50', '#ffeb3b', '#ff9800', '#42a5f5'],
          label: 'Aspectos destacables del restaurante'
        }]
      },
      options: {
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#000000', // Color del texto de la leyenda
              font: {
                size:16,
                family:'LoveYaLikeASister'
              }
            }
          },
          title: {
            display: true,
            text: 'Aspectos destacables segun clientes',
            color: '#000000', // Color del título del gráfico
            font: {
              size:17,
              family:'LoveYaLikeASister'
            }
          }
        }
      }
    });
  
    // Recommendation Chart
    new Chart('recommendationChart', {
      type: 'bar',
      data: {
        labels: ['No lo recomendaría', 'Poco probable', 'Muy probable'],
        datasets: [{
          data: [recommendationCounts.noProbable, recommendationCounts.pocoProbable, recommendationCounts.MuyProbable],
          backgroundColor: ['#f44336', '#ffeb3b', '#4caf50'],
          label: 'Probabilidad de Recomendar'
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: '',
              color: '#000000', // Color del título del eje Y
              font: {
                size:15,
                family:'LoveYaLikeASister'
              } 
            },
            ticks: {
              color: '#000000',
              font: {
                size:15,
                family:'LoveYaLikeASister'
              }                             // Color de los textos del eje Y
            }
          },
          x: {
            ticks: {
              color: '#000000', // Color de los textos del eje X
              font: {
                size:15,
                family:'LoveYaLikeASister'
              } 
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#000000', // Color del texto de la leyenda
              font: {
                size:15,
                family:'LoveYaLikeASister'
              } 
            }
          },
          title: {
            display: true,
            text: 'Probabilidad de Recomendar',
            color: '#000000', // Color del título del gráfico
            font: {
              size:17,
              family:'LoveYaLikeASister'
            } 
          }
        }
      }
    });
  }
  

  private countOccurrences(arr: string[], labels: string[]): number[] {

    const counts: { [key: string]: number } = labels.reduce((acc, label) => ({ ...acc, [label]: 0 }), {});
    
    arr.forEach(value => {
      if (value in counts) counts[value]++;
    });

    return labels.map(label => counts[label]);
  }

  private getAspectCounts(data: { aspectos: { [key: string]: boolean } }[]): { [key: string]: number } {
    
    const counts: { [key: string]: number } = { comida: 0, limpieza: 0, ambiente: 0, atencionAlCliente: 0 };
    
    
    data.forEach(d => {
      for (const key of Object.keys(counts)) {
        if (d.aspectos && d.aspectos[key]) {
          counts[key]++;
        }
      }
    });
  
    return counts;
  }

  private getSatisfaccionPromedio(data: { satisfaccion: number }[]): number {
    const totalSatisfaccion = data.reduce((sum, item) => sum + item.satisfaccion, 0);
    return totalSatisfaccion / data.length;
  }

  private getRecommendationCounts(data: any[]): { noProbable: number, pocoProbable: number, MuyProbable: number } {
    const counts: { noProbable: number, pocoProbable: number, MuyProbable: number } = { noProbable: 0, pocoProbable: 0, MuyProbable: 0 };
    data.forEach(d => {
     
      if (d.frecuencia && (d.frecuencia in counts)) {
        counts[d.frecuencia as keyof typeof counts]++;
      }
    });
    return counts;
  }

  goBack() {
    this.navCtrl.back();
  }
}
