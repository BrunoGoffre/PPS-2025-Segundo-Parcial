import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonIcon,
  IonButton,
} from '@ionic/angular/standalone';
import { Chart, registerables } from 'chart.js';
import {
  Firestore,
  collectionData,
  collection,
  getDocs,
} from '@angular/fire/firestore';
import { NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline } from 'ionicons/icons';

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
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
    IonButtons,
    IonIcon,
    IonButton,
  ],
})
export class ResultadosEncuestasPage implements OnInit {
  comentarios: Comentario[] = [];

  constructor(private firestore: Firestore, private navCtrl: NavController) {
    addIcons({ arrowBackOutline });
  }

  ngOnInit() {
    this.loadSurveyData();
  }

  private async loadSurveyData(): Promise<void> {
    const encuestasRef = collection(this.firestore, 'encuestas'); // Trae los resultados de encuestas de CLIENTES
    try {
      const snapshot = await getDocs(encuestasRef);
      const data = snapshot.docs.map((doc) => doc.data());

      if (data.length > 0) {
        this.renderCharts(data);

        this.comentarios = data
          .filter((d) => d['comentarios'] && d['comentarios'].trim() !== '')
          .map((d) => ({
            nombre: d['nombre'] || 'Anónimo',
            apellido: d['apellido'] || '',
            comentarios: d['comentarios'] || '',
          }));
      } else {
        console.log('No hay datos de encuestas disponibles');
      }
    } catch (error) {
      console.error('Error al cargar los datos de encuestas:', error);
    }
  }

  private renderCharts(data: any[]) {
    // Extract data for each chart
    const satisfaccionPromedio = this.getSatisfaccionPromedio(data);
    const serviceRatings = data.map((d) => d.calificacion);
    const highlightedAspects = this.getAspectCounts(data);
    const recommendationCounts = this.getRecommendationCounts(data);

    // Configuración común de fuentes y colores
    const fontConfig = {
      family: 'Arial, sans-serif',
      size: 14,
      weight: 'bold' as const,
    };

    const colors = {
      primary: '#355ca1',
      secondary: '#5438c9',
      success: '#4caf50',
      warning: '#ffeb3b',
      danger: '#f44336',
      info: '#42a5f5',
      background: 'rgba(255, 255, 255, 0.8)',
    };

    // Satisfaction Chart
    new Chart('satisfaccionChart', {
      type: 'bar',
      data: {
        labels: ['Satisfacción General'],
        datasets: [
          {
            label: 'Promedio de Satisfacción',
            data: [satisfaccionPromedio],
            backgroundColor: colors.primary,
            borderColor: colors.secondary,
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: '#000000',
              font: fontConfig,
            },
          },
          x: {
            ticks: {
              color: '#000000',
              font: fontConfig,
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#000000',
              font: fontConfig,
            },
          },
          title: {
            display: true,
            text: 'Promedio de Satisfacción',
            color: '#000000',
            font: {
              ...fontConfig,
              size: 16,
            },
          },
        },
      },
    });

    // Service Rating Chart
    new Chart('serviceRatingChart', {
      type: 'bar',
      data: {
        labels: ['Excelente', 'Bueno', 'Regular', 'Malo'],
        datasets: [
          {
            data: this.countOccurrences(serviceRatings, [
              'Excelente',
              'Bueno',
              'Regular',
              'Malo',
            ]),
            backgroundColor: [
              colors.success,
              colors.warning,
              colors.info,
              colors.danger,
            ],
            label: 'Calificación de la comida',
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#000000',
              font: fontConfig,
            },
          },
          x: {
            ticks: {
              color: '#000000',
              font: fontConfig,
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#000000',
              font: fontConfig,
            },
          },
          title: {
            display: true,
            text: 'Calificación del Servicio',
            color: '#000000',
            font: {
              ...fontConfig,
              size: 16,
            },
          },
        },
      },
    });

    // Aspects Highlighted Chart
    new Chart('aspectsChart', {
      type: 'pie',
      data: {
        labels: ['Comida', 'Limpieza', 'Ambiente', 'Atención al cliente'],
        datasets: [
          {
            data: [
              highlightedAspects['comida'],
              highlightedAspects['limpieza'],
              highlightedAspects['ambiente'],
              highlightedAspects['atencionAlCliente'],
            ],
            backgroundColor: [
              colors.success,
              colors.warning,
              colors.info,
              colors.primary,
            ],
            label: 'Aspectos destacables del restaurante',
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#000000',
              font: fontConfig,
            },
          },
          title: {
            display: true,
            text: 'Aspectos destacables según clientes',
            color: '#000000',
            font: {
              ...fontConfig,
              size: 16,
            },
          },
        },
      },
    });

    // Recommendation Chart
    new Chart('recommendationChart', {
      type: 'bar',
      data: {
        labels: ['No lo recomendaría', 'Poco probable', 'Muy probable'],
        datasets: [
          {
            data: [
              recommendationCounts.noProbable,
              recommendationCounts.pocoProbable,
              recommendationCounts.MuyProbable,
            ],
            backgroundColor: [colors.danger, colors.warning, colors.success],
            label: 'Probabilidad de Recomendar',
          },
        ],
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#000000',
              font: fontConfig,
            },
          },
          x: {
            ticks: {
              color: '#000000',
              font: fontConfig,
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#000000',
              font: fontConfig,
            },
          },
          title: {
            display: true,
            text: 'Probabilidad de Recomendar',
            color: '#000000',
            font: {
              ...fontConfig,
              size: 16,
            },
          },
        },
      },
    });
  }

  private countOccurrences(arr: string[], labels: string[]): number[] {
    const counts: { [key: string]: number } = labels.reduce(
      (acc, label) => ({ ...acc, [label]: 0 }),
      {}
    );

    arr.forEach((value) => {
      if (value in counts) counts[value]++;
    });

    return labels.map((label) => counts[label]);
  }

  private getAspectCounts(data: { aspectos: { [key: string]: boolean } }[]): {
    [key: string]: number;
  } {
    const counts: { [key: string]: number } = {
      comida: 0,
      limpieza: 0,
      ambiente: 0,
      atencionAlCliente: 0,
    };

    data.forEach((d) => {
      if (d.aspectos) {
        for (const key of Object.keys(counts)) {
          if (d.aspectos[key]) {
            counts[key]++;
          }
        }
      }
    });

    return counts;
  }

  private getSatisfaccionPromedio(data: { satisfaccion: number }[]): number {
    if (data.length === 0) return 0;

    const totalSatisfaccion = data.reduce((sum, item) => {
      return sum + (item.satisfaccion || 0);
    }, 0);

    return Math.round((totalSatisfaccion / data.length) * 10) / 10; // Redondear a 1 decimal
  }

  private getRecommendationCounts(data: any[]): {
    noProbable: number;
    pocoProbable: number;
    MuyProbable: number;
  } {
    const counts: {
      noProbable: number;
      pocoProbable: number;
      MuyProbable: number;
    } = { noProbable: 0, pocoProbable: 0, MuyProbable: 0 };

    data.forEach((d) => {
      if (d.frecuencia && d.frecuencia in counts) {
        counts[d.frecuencia as keyof typeof counts]++;
      }
    });

    return counts;
  }

  goBack() {
    this.navCtrl.back();
  }
}
