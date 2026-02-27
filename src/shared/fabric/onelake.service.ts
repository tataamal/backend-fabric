import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientSecretCredential } from '@azure/identity';
import { DataLakeServiceClient } from '@azure/storage-file-datalake';

@Injectable()
export class OneLakeService {
  private readonly logger = new Logger(OneLakeService.name);

  private readonly workspace: string;
  private readonly lakehouse: string;
  private readonly basePath: string;

  private readonly serviceClient: DataLakeServiceClient;

  constructor(private readonly config: ConfigService) {
    const tenantId = this.must('AZURE_TENANT_ID');
    const clientId = this.must('AZURE_CLIENT_ID');
    const clientSecret = this.must('AZURE_CLIENT_SECRET');

    this.workspace = this.must('FABRIC_WORKSPACE');
    this.lakehouse = this.must('FABRIC_LAKEHOUSE');

    // contoh: Files/sap_rfc
    this.basePath = this.normalizePath(this.must('FABRIC_BASE_PATH'));

    const credential = new ClientSecretCredential(
      tenantId,
      clientId,
      clientSecret,
    );

    // OneLake DFS endpoint (ADLS compatible)
    this.serviceClient = new DataLakeServiceClient(
      'https://onelake.dfs.fabric.microsoft.com',
      credential,
    );

    this.logger.log(
      `OneLake client ready. workspace="${this.workspace}", lakehouse="${this.lakehouse}"`,
    );
  }

  private must(key: string): string {
    const v = this.config.get<string>(key);
    if (!v) throw new Error(`Missing env: ${key}`);
    return v;
  }

  private normalizePath(p: string): string {
    return p.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
  }

  private pad2(n: number) {
    return String(n).padStart(2, '0');
  }

  /**
   * Upload JSON ke:
   * <workspace filesystem> /
   *   <lakehouse>.lakehouse/<basePath>/<rfcLower>/YYYY/MM/DD/<filename>.json
   */
  async uploadJson(
    rfcName: string,
    payload: any,
    opts?: {
      subfolder?: string; // contoh: "smg" / "sby"
      fileName?: string; // contoh: "z_rfc_trck_sernum_smg.json"
      useDateFolders?: boolean; // default true
    },
  ) {
    const rfc = rfcName.toLowerCase();
    const now = new Date();

    const yyyy = String(now.getFullYear());
    const mm = this.pad2(now.getMonth() + 1);
    const dd = this.pad2(now.getDate());

    const fsClient = this.serviceClient.getFileSystemClient(this.workspace);

    const sub = opts?.subfolder ? this.normalizePath(opts.subfolder) : '';
    const subPart = sub ? `/${sub}` : '';

    const useDateFolders = opts?.useDateFolders ?? true;
    const datePart = useDateFolders ? `/${yyyy}/${mm}/${dd}` : '';

    // default nama file: "<rfc>.json" (kalau tidak diberi fileName)
    const fileName = (opts?.fileName ?? `${rfc}.json`).toLowerCase();

    const dirPath = `${this.lakehouse}.lakehouse/${this.basePath}/${rfc}${subPart}${datePart}`;
    const directoryClient = fsClient.getDirectoryClient(dirPath);
    await directoryClient.createIfNotExists();

    const fileClient = directoryClient.getFileClient(fileName);

    const json = JSON.stringify(payload);
    const data = Buffer.from(json, 'utf-8');

    // overwrite bersih: delete file lama lalu buat baru
    await fileClient.deleteIfExists();
    await fileClient.create();
    await fileClient.append(data, 0, data.length);
    await fileClient.flush(data.length);

    const fullPath = `${dirPath}/${fileName}`;
    this.logger.log(`Uploaded to OneLake: ${fullPath}`);

    return { path: fullPath, bytes: data.length };
  }
}
