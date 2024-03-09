import { Injectable } from '@angular/core';
import {
  Camera,
  CameraPhoto,
  CameraResultType,
  CameraSource,
  Photo,
} from '@capacitor/camera';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Foto } from '../models/foto.interface';

@Injectable({
  providedIn: 'root',
})
export class FotoService {
  public fotos: Foto[] = [];

  private PHOTO_STORAGE: string = 'fotos';

  constructor() {}
  public async addNewToGallery() {
    const fotoCapturada = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100,
    });

    const saveimageFile = await this.savePicture(fotoCapturada);

    if (saveimageFile !== undefined && saveimageFile !== null) {
      const webviewPath = fotoCapturada.webPath ? fotoCapturada.webPath : '';
      this.fotos.unshift({
        filePath: 'foto_',
        webviewPath: webviewPath,
      });
    }

    Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.fotos)
    })
  }

  public async savePicture(cameraPhoto: CameraPhoto) {
    const base64Data = await this.readBase64(cameraPhoto);

    const fileName = new Date().getTime + '.jpeg';
    const saveFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    return {
      filePath: fileName,
      webviewPath: cameraPhoto.webPath,
    };
  }

  public async readBase64(cameraPhoto: CameraPhoto) {
    const response = await fetch(cameraPhoto.webPath!);
    const blob = await response.blob();
    return (await this.convertBlobToBase64(blob)) as string;
  }

  convertBlobToBase64 = (blob: Blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    });

  public async loadSave() {
    //Recuperar informacion de la cache
    const listaFotos = await Preferences.get({ key: this.PHOTO_STORAGE });
    if (listaFotos !== null && listaFotos.value !== null) {
      this.fotos = JSON.parse(listaFotos.value);
    } else {
      // Manejar el caso en que listaFotos o listaFotos.value sea null
      this.fotos = [];
      console.error('No se encontraron fotos en la cache');
    }
    for (let foto of this.fotos) {
      const readFile = await Filesystem.readFile({
        path: foto.filePath,
        directory: Directory.Data,
      });

      foto.webviewPath = `data: image/jpeg;base64,${readFile.data}`;
    }
  }
}
