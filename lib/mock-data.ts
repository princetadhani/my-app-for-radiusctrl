export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  icon?: string;
  children?: FileNode[];
}

export const mockFileTree: FileNode[] = [
  {
    name: "3.0",
    type: "directory",
    path: "/etc/freeradius/3.0",
    children: [
      {
        name: "radiusd.conf",
        type: "file",
        path: "/etc/freeradius/3.0/radiusd.conf"
      },
      {
        name: "clients.conf",
        type: "file",
        path: "/etc/freeradius/3.0/clients.conf",
        icon: "shield"
      },
      {
        name: "mods-enabled",
        type: "directory",
        path: "/etc/freeradius/3.0/mods-enabled",
        children: [
          { name: "eap", type: "file", path: "/etc/freeradius/3.0/mods-enabled/eap" },
          { name: "ldap", type: "file", path: "/etc/freeradius/3.0/mods-enabled/ldap" },
          { name: "sql", type: "file", path: "/etc/freeradius/3.0/mods-enabled/sql" },
        ]
      },
      {
        name: "sites-enabled",
        type: "directory",
        path: "/etc/freeradius/3.0/sites-enabled",
        children: [
          { name: "default", type: "file", path: "/etc/freeradius/3.0/sites-enabled/default" },
          { name: "inner-tunnel", type: "file", path: "/etc/freeradius/3.0/sites-enabled/inner-tunnel" },
        ]
      },
      {
        name: "users",
        type: "file",
        path: "/etc/freeradius/3.0/users",
        icon: "users"
      },
    ]
  }
];

export const mockFileContents: Record<string, string> = {
  '/etc/freeradius/3.0/radiusd.conf': `#  FreeRADIUS configuration
#  Version 3.0
prefix = /usr
exec_prefix = /usr
sysconfdir = /etc
localstatedir = /var
sbindir = \${exec_prefix}/sbin
logdir = /var/log/freeradius
raddbdir = /etc/freeradius/3.0

name = freeradius
confdir = \${raddbdir}
modconfdir = \${confdir}/mods-config

# Logging
log {
    destination = files
    colourise = yes
    file = \${logdir}/radius.log
}

# Security
security {
    max_attributes = 200
    reject_delay = 1
    status_server = yes
}`,

  '/etc/freeradius/3.0/clients.conf': `# Client definitions
client localhost {
    ipaddr = 127.0.0.1
    secret = testing123
    nas_type = other
    shortname = localhost
}

client private-network-1 {
    ipaddr = 192.168.1.0/24
    secret = SuperSecretKey!2024
    nas_type = cisco
    shortname = private-net
}`,

  '/etc/freeradius/3.0/users': `# FreeRADIUS User Database
# Version 3.0
# Format: username  Auth-Type := value, attributes

# Administrative Users
admin    Cleartext-Password := "Admin@2024!Secure"
         Service-Type = Administrative-User,
         Reply-Message = "Welcome, Administrator!",
         Framed-IP-Address = 10.0.0.1

radiusadmin  Cleartext-Password := "RadiusAdmin#2024"
         Service-Type = Administrative-User,
         Reply-Message = "Radius Admin Access Granted"

# Regular Users
john.doe     Cleartext-Password := "John@Pass123"
         Service-Type = Framed-User,
         Framed-Protocol = PPP,
         Framed-IP-Address = 192.168.1.100,
         Framed-Compression = Van-Jacobson-TCP-IP,
         Reply-Message = "Welcome John Doe"

alice.smith  Cleartext-Password := "Alice#2024"
         Service-Type = Framed-User,
         Framed-Protocol = PPP,
         Framed-IP-Address = 192.168.1.101,
         Session-Timeout = 3600,
         Idle-Timeout = 600,
         Reply-Message = "Welcome Alice Smith"

bob.johnson  Cleartext-Password := "Bob!Secure99"
         Service-Type = Framed-User,
         Framed-Protocol = PPP,
         Framed-IP-Netmask = 255.255.255.0,
         Framed-Route = "192.168.10.0/24 192.168.1.1 1",
         Reply-Message = "Welcome Bob Johnson"

# VPN Users Group
vpnuser1     Cleartext-Password := "VPN#User1234"
         Service-Type = Framed-User,
         Framed-Protocol = PPP,
         Framed-IP-Address = 10.10.10.10,
         MS-Primary-DNS-Server = 8.8.8.8,
         MS-Secondary-DNS-Server = 8.8.4.4,
         Reply-Message = "VPN Access Granted"

vpnuser2     Cleartext-Password := "VPN#User5678"
         Service-Type = Framed-User,
         Framed-Protocol = PPP,
         Framed-IP-Address = 10.10.10.11,
         MS-Primary-DNS-Server = 8.8.8.8,
         MS-Secondary-DNS-Server = 8.8.4.4

# Guest Access
guest        Cleartext-Password := "Guest@123"
         Service-Type = Framed-User,
         Session-Timeout = 1800,
         Idle-Timeout = 300,
         Reply-Message = "Guest Access - Limited Session",
         Framed-Filter-Id = "guest-filter"

# Test Users
testuser     Cleartext-Password := "testing123"
         Service-Type = Framed-User,
         Framed-Protocol = PPP,
         Reply-Message = "Test User Access"

# MAC Authentication Bypass
001122334455 Auth-Type := Accept
         Service-Type = Call-Check,
         Reply-Message = "MAC Auth Bypass Successful"

# Reject all others
DEFAULT      Auth-Type := Reject
         Reply-Message = "Access denied - Invalid credentials"`,

  '/etc/freeradius/3.0/mods-enabled/eap': `# EAP module configuration
eap {
    default_eap_type = peap
    timer_expire = 60
    ignore_unknown_eap_types = no
    cisco_accounting_username_bug = no
    max_sessions = \${max_requests}
}`,

  '/etc/freeradius/3.0/mods-enabled/ldap': `# LDAP module configuration
ldap {
    server = "ldap.example.com"
    port = 389
    identity = "cn=admin,dc=example,dc=com"
    password = ldap_password
    base_dn = "dc=example,dc=com"
}`,

  '/etc/freeradius/3.0/mods-enabled/sql': `# SQL module configuration
sql {
    driver = "mysql"
    server = "localhost"
    port = 3306
    login = "radius"
    password = "radpass"
    radius_db = "radius"
}`,

  '/etc/freeradius/3.0/sites-enabled/default': `# Default virtual server
server default {
    listen {
        type = auth
        ipaddr = *
        port = 1812
    }
    
    authorize {
        filter_username
        preprocess
        eap
    }
    
    authenticate {
        eap
    }
}`,

  '/etc/freeradius/3.0/sites-enabled/inner-tunnel': `# Inner tunnel virtual server
server inner-tunnel {
    listen {
        ipaddr = 127.0.0.1
        port = 18120
        type = auth
    }
    
    authorize {
        filter_username
        files
    }
}`,
};

