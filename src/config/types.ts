/**
 * ユーザーが設定する必要のある情報
 */
export type Source = {
	port?: number;
	proxy?: string;
  maxFileSize?: number;
	allowedPrivateNetworks?: string[];
};

/**
 * Misskeyが自動的に(ユーザーが設定した情報から推論して)設定する情報
 */
export type Mixin = {
	userAgent: string;
};

export type Config = Source & Mixin;
