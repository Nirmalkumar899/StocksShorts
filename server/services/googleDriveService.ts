import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';

export class GoogleDriveService {
  private drive: any;

  constructor() {
    try {
      // Try to use the correct credentials directly
      const credentials = {
        client_email: 'stocksshortsnew@spartan-perigee-463004-u2.iam.gserviceaccount.com',
        private_key: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCiRcGKnIBb1qO9
/34kju164u0J7wPKJk8hZtazAS9uI/Oyg3PZptBqbmgFUnfvh1vw+8CZlP3XKJr2
YOVU9tpG+XESzpguvwue9wjujjeeV6/5iLnilkISkLLbnQgK8qSPkH36hKNjLE0p
yqDUNLCZNiyTaGbIn5jTctUMsZpojZBzZf2BIhtbzofkp4cs2uKZapHr/mWkNI7I
ubjvuuPZq/StXXi2UtL/2htZw8MOX7z5bm0a7DJGitsN9FCsc3EwbdgXTQkDUWIL
RZLA4HOdvMN2UTWF9yKcJq73TMPmxA4vl/t9eVbwt0s6p02b60jFk85KdTg3d9yP
EJqwK6pRAgMBAAECggEAA+OlnZ+eIPVeQ8/Dk3c8gGE/eqk4n0f3Rg7rruskmqBw
dxMY+/q4TJC8XAJLvxkwrjAuf8/XHKjLvAN7A6QN+7z/RYrfkWFBU0xK8cLFWP1z
iYjKIcDlsQG4U7SqDG8f3BQDvPUgYGBfshR58dQYdnearmbGbeELXegG7LC2CXLv
YNEn2YfATib9hJrEWAltUvV3gD59PLK/qpyRDuBR5v0bV9XgYhXE+CDGEuztOHkj
Csi2C+sgXfD3Q05c33nwBMYBV02+9A2yP5nrs9EZnyHH9enOxZI3hUbbiULLTzIO
2gkUoC21Udk/WzQ0wtSYkKfm44Kdk2vmq5PC0PxeNQKBgQDSIDY/xoQUmlRNY9cM
W1+jCmxkzpl+VXxYbuuThMowAAEbxOXfKOnO7OQGAumqKezpFslnXsnAF4+N5fFV
TZQqcFPd8JiyrzqCsRglODc31z4rAztYsA+JFXOU/ZavaA2uarW49q+T1w/IfoQs
4iNdT9IRiVqMAQRwOsMD1x0+ZQKBgQDFsw27lHaxkvB7rfQ4rjvUyOzoLk4Meh18
QELP0nO7vsY26nf4vRj78Rp58lWSNMen7zv4EHK/lnXJtbOpyOvTnJvaZr2/hg8U
7IvTMb5j3wntiK1c1b5Z180/2U5VCVkZ9TfhGqM3vlWKE7AR7eq7oA4q3HvqqyXe
6Ey10IK3fQKBgQCLB/s9GXndM/whtLTenTrbYxMzZCvVlnSPAt1mn080kVwqZo5+
qNCDNOTvQVAgYls6IvSiK+qr6ir3BbU37vvhVK95Qy+V0zGQteK3BcorbYTZ6uqC
lQPCfWobo+rnJp8ez8ZrmvWziXINBAEqvXoOzLi/F7XMuwOXypmsWdIkrQKBgHST
qdRjrj31zJLRt8I4k5Vcyb37mBBpbbuX1Q3hJleeHhnB1u646uOdf6RLDsSBFP5k
5rLXWCK7YUeJOqEylkUZAxodHWSzc28+MRFfMsqHeb40qy2j6HPn+eLdjAA+2+if
nczCPV6ggKZEB7360kDDF7eUfgmZ1GIGDz3i70GtAoGBAM3ac0Q0ReLiiP78GDTd
q5t80ZKK/8v6TPjLgOhNKEbk9+gaMF3QdMLDm2F/QPTRHtJ5YqhEcGpFG+9MfYTL
mmhzWIy+JIeLEG2niJn0we38MFAV1wA21O3hvK1+kE0pc6AmkiaG8wZP1vE8Vrr5
d2GAl5/tNtf4+q+wE7ll3cIM
-----END PRIVATE KEY-----`
      };

      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      });
      
      this.drive = google.drive({ version: 'v3', auth });
      console.log('Google Drive service initialized with hardcoded service account credentials');
      
    } catch (error) {
      console.error('Error initializing Google Drive service:', error);
      // Fallback to API key if available
      if (process.env.GOOGLE_API_KEY) {
        this.drive = google.drive({ 
          version: 'v3', 
          auth: process.env.GOOGLE_API_KEY 
        });
        console.log('Fallback to Google API key');
      } else {
        this.drive = null;
        console.log('No Google credentials available');
      }
    }
  }

  async findAIDatabaseFolder(): Promise<string | null> {
    // Use the specific folder ID provided by the user
    const specificFolderId = '1eqDB7dEOVDHhOA4xMagH0sO4soe6EcMW';
    
    try {
      // Check if drive is initialized
      if (!this.drive) {
        console.log('Google Drive not initialized. Need GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY for private folders, or GOOGLE_API_KEY for public folders.');
        return null;
      }

      // Verify the folder exists and is accessible
      const response = await this.drive.files.get({
        fileId: specificFolderId,
        fields: 'id,name,mimeType'
      });

      if (response.data && response.data.mimeType === 'application/vnd.google-apps.folder') {
        console.log(`Successfully connected to AI Database folder: ${response.data.name} (${specificFolderId})`);
        return specificFolderId;
      } else {
        console.error('Specified folder ID is not a valid folder');
        return null;
      }
    } catch (error) {
      console.error('Error accessing AI Database folder:', error);
      console.log('This folder is likely private. You need to provide GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY credentials and share the folder with the service account email.');
      return null;
    }
  }

  async searchCompanyFolders(companyName: string): Promise<any[]> {
    try {
      // Access the specific AI Database folder
      const aiDatabaseId = await this.findAIDatabaseFolder();
      if (!aiDatabaseId) {
        console.log('Cannot access the specified AI Database folder');
        return [];
      }
      console.log(`Using AI Database folder with ID: ${aiDatabaseId}`);

      // Search for company folder within the specific AI Database folder
      // Try multiple search patterns to find the company folder
      const searchPatterns = [
        companyName, // Exact match
        companyName.split(' ')[0], // First word only
        companyName.toLowerCase(),
        companyName.toUpperCase()
      ];

      let allFolders: any[] = [];
      
      for (const pattern of searchPatterns) {
        const response = await this.drive.files.list({
          q: `name contains '${pattern}' and '${aiDatabaseId}' in parents and mimeType = 'application/vnd.google-apps.folder'`,
          fields: 'files(id,name,parents)',
          orderBy: 'name'
        });
        
        const folders = response.data.files || [];
        console.log(`Search pattern "${pattern}" found ${folders.length} folders:`, folders.map(f => f.name));
        allFolders = allFolders.concat(folders);
      }

      // Remove duplicates based on folder ID
      const uniqueFolders = allFolders.filter((folder, index, self) => 
        index === self.findIndex(f => f.id === folder.id)
      );

      return uniqueFolders;
    } catch (error) {
      console.error('Error searching company folders in AI Database:', error);
      return [];
    }
  }

  async listAllFoldersInAIDatabase(): Promise<any[]> {
    try {
      const aiDatabaseId = await this.findAIDatabaseFolder();
      if (!aiDatabaseId) {
        return [];
      }

      const response = await this.drive.files.list({
        q: `'${aiDatabaseId}' in parents and mimeType = 'application/vnd.google-apps.folder'`,
        fields: 'files(id,name)',
        orderBy: 'name'
      });

      const folders = response.data.files || [];
      console.log(`Available company folders in AI Database:`, folders.map(f => f.name));
      return folders;
    } catch (error) {
      console.error('Error listing folders in AI Database:', error);
      return [];
    }
  }

  async getFilesFromFolder(folderId: string): Promise<any[]> {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents`,
        fields: 'files(id,name,mimeType,modifiedTime,size)',
        orderBy: 'modifiedTime desc'
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Error getting files from folder:', error);
      return [];
    }
  }

  async getFileContent(fileId: string): Promise<string> {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      });

      return response.data;
    } catch (error) {
      console.error('Error getting file content:', error);
      return '';
    }
  }

  async exportGoogleDoc(fileId: string): Promise<string> {
    try {
      const response = await this.drive.files.export({
        fileId: fileId,
        mimeType: 'text/plain'
      });

      return response.data;
    } catch (error) {
      console.error('Error exporting Google Doc:', error);
      return '';
    }
  }

  async exportGoogleSheet(fileId: string): Promise<string> {
    try {
      const response = await this.drive.files.export({
        fileId: fileId,
        mimeType: 'text/csv'
      });

      return response.data;
    } catch (error) {
      console.error('Error exporting Google Sheet:', error);
      return '';
    }
  }

  async searchCompanyData(companyName: string): Promise<{
    folders: any[],
    documents: any[],
    sheets: any[],
    content: string[]
  }> {
    try {
      // First find the AI Database folder
      const aiDatabaseId = await this.findAIDatabaseFolder();
      if (!aiDatabaseId) {
        console.log('AI Database folder not found, returning empty results');
        return { folders: [], documents: [], sheets: [], content: [] };
      }

      // Search for company folders within AI Database
      const folders = await this.searchCompanyFolders(companyName);
      
      // Search for company documents within AI Database folder
      const docResponse = await this.drive.files.list({
        q: `name contains '${companyName}' and '${aiDatabaseId}' in parents and (mimeType = 'application/vnd.google-apps.document' or mimeType = 'text/plain' or mimeType = 'application/pdf')`,
        fields: 'files(id,name,mimeType,modifiedTime)',
        orderBy: 'modifiedTime desc'
      });

      // Search for company spreadsheets within AI Database folder
      const sheetResponse = await this.drive.files.list({
        q: `name contains '${companyName}' and '${aiDatabaseId}' in parents and mimeType = 'application/vnd.google-apps.spreadsheet'`,
        fields: 'files(id,name,mimeType,modifiedTime)',
        orderBy: 'modifiedTime desc'
      });

      const documents = docResponse.data.files || [];
      const sheets = sheetResponse.data.files || [];

      // Extract content from documents
      const content: string[] = [];
      
      // Get content from up to 5 most recent documents
      for (const doc of documents.slice(0, 5)) {
        let docContent = '';
        
        if (doc.mimeType === 'application/vnd.google-apps.document') {
          docContent = await this.exportGoogleDoc(doc.id);
        } else if (doc.mimeType === 'text/plain') {
          docContent = await this.getFileContent(doc.id);
        }
        
        if (docContent) {
          content.push(`Document: ${doc.name}\n${docContent}`);
        }
      }

      // Get content from up to 3 most recent spreadsheets
      for (const sheet of sheets.slice(0, 3)) {
        const sheetContent = await this.exportGoogleSheet(sheet.id);
        if (sheetContent) {
          content.push(`Spreadsheet: ${sheet.name}\n${sheetContent}`);
        }
      }

      // Get content from files in company folders
      for (const folder of folders.slice(0, 3)) {
        const folderFiles = await this.getFilesFromFolder(folder.id);
        
        for (const file of folderFiles.slice(0, 3)) {
          let fileContent = '';
          
          if (file.mimeType === 'application/vnd.google-apps.document') {
            fileContent = await this.exportGoogleDoc(file.id);
          } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
            fileContent = await this.exportGoogleSheet(file.id);
          } else if (file.mimeType === 'text/plain') {
            fileContent = await this.getFileContent(file.id);
          }
          
          if (fileContent) {
            content.push(`File from ${folder.name}: ${file.name}\n${fileContent}`);
          }
        }
      }

      return {
        folders,
        documents,
        sheets,
        content
      };
    } catch (error) {
      console.error('Error searching company data:', error);
      return {
        folders: [],
        documents: [],
        sheets: [],
        content: []
      };
    }
  }
}

export const googleDriveService = new GoogleDriveService();