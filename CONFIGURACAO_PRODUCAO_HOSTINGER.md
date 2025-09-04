# Configuração de Produção na Hostinger

## ⚠️ IMPORTANTE - CONFIGURAÇÕES OBRIGATÓRIAS

### 1. Credenciais do Banco de Dados
No arquivo `config/database.php`, substitua os valores entre as linhas 8-11:

```php
define('DB_NAME', 'u123456789_toloni'); // Substitua pelo nome real do seu banco
define('DB_USER', 'u123456789_user');   // Substitua pelo usuário real
define('DB_PASS', 'SuaSenhaSegura123'); // Substitua pela senha real
```

### 2. Estrutura de Arquivos na Hostinger
Coloque os arquivos na pasta `public_html` ou na pasta do seu domínio:

```
public_html/
├── index.html (arquivo do React build)
├── api/
│   ├── auth/
│   │   ├── login.php
│   │   ├── register.php
│   │   ├── check-session.php
│   │   ├── logout.php
│   │   └── outros arquivos...
│   └── outros endpoints...
├── config/
│   ├── database.php
│   ├── session_cookies.php
│   ├── security.php
│   └── outros configs...
├── assets/ (CSS, JS, imagens do React)
└── outros arquivos estáticos...
```

### 3. Banco de Dados
1. Crie um banco MySQL no painel da Hostinger
2. Anote as credenciais fornecidas (host, database, username, password)
3. Importe os arquivos SQL:
   - `database/schema.sql`
   - `database/trophies_schema.sql`

### 4. Teste da API
Após configurar, teste os endpoints:

- **Login**: `https://seudominio.com.br/api/auth/login.php`
- **Registro**: `https://seudominio.com.br/api/auth/register.php`
- **Sessão**: `https://seudominio.com.br/api/auth/check-session.php`

### 5. Verificações de Funcionamento

1. **Teste de Conexão com Banco**: Acesse `https://seudominio.com.br/api/auth/check-session.php` diretamente no navegador
2. **Teste de CORS**: Tente fazer login pelo frontend
3. **Teste de Cookies**: Verifique se os cookies de sessão estão sendo definidos

### 6. Problemas Comuns e Soluções

#### Erro 500 (Internal Server Error)
- Verifique as credenciais do banco em `config/database.php`
- Confirme que o banco foi criado e as tabelas importadas
- Verifique os logs de erro da Hostinger

#### Erro de CORS
- Certifique-se de que o domínio está correto na detecção de ambiente
- Verifique se HTTPS está ativo no domínio

#### Erro de Conexão com API
- Confirme que os arquivos PHP estão na estrutura correta
- Teste os endpoints diretamente no navegador
- Verifique se o PHP 8.0+ está ativo na Hostinger

### 7. Checklist Final

- [ ] Credenciais do banco atualizadas em `config/database.php`
- [ ] Arquivos carregados na estrutura correta
- [ ] Banco de dados criado e schemas importados
- [ ] HTTPS ativo no domínio
- [ ] Teste de login funcionando
- [ ] Cookies de sessão sendo definidos corretamente

### 8. Debug em Caso de Problemas

Se o login ainda não funcionar, verifique:

1. **No navegador**: Abra as Ferramentas do Desenvolvedor (F12) e vá na aba Network para ver as requisições
2. **No servidor**: Verifique os logs de erro da Hostinger no painel de controle
3. **Teste direto**: Acesse `https://seudominio.com.br/api/auth/check-session.php` para ver se retorna JSON válido

## Contato
Se ainda houver problemas, verifique:
- Versão do PHP (deve ser 8.0+)
- Extensões PHP necessárias (PDO, OpenSSL, cURL)
- Permissões de arquivo (644 para PHP, 755 para pastas)