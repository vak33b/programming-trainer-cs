import { Link, useNavigate, useLocation } from "react-router-dom";
import { Layout as AntLayout, Menu, Button, Typography } from "antd";
import { useAuth } from "../context/AuthContext";
import {
  BookOutlined,
  LoginOutlined,
  LogoutOutlined,
  HomeOutlined,
} from "@ant-design/icons";

const { Header, Content } = AntLayout;
const { Title, Text } = Typography;

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

   const menuItems = [
    {
      key: "/",
      icon: <HomeOutlined />,
      label: <Link to="/">Главная</Link>,
    },
  ];

  if (user) {
    // "Мои курсы" и "Все курсы" только для студентов (не преподавателей)
    if (!user.is_teacher) {
      menuItems.push({
        key: "/all-courses",
        icon: <BookOutlined />,
        label: <Link to="/all-courses">Все курсы</Link>,
      });
      menuItems.push({
        key: "/my-courses",
        icon: <BookOutlined />,
        label: <Link to="/my-courses">Мои курсы</Link>,
      });
    }

    if (user.is_teacher) {
      menuItems.push({
        key: "/teacher",
        icon: <BookOutlined />,
        label: <Link to="/teacher">Панель преподавателя</Link>,
      });
    }
  }


  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginRight: "24px",
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        >
          <Title level={3} style={{ color: "#fff", margin: 0 }}>
            Bereza TRPS
          </Title>
        </div>

        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ flex: 1 }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user ? (
            <>
              <Text style={{ color: "#fff" }}>
                {user.full_name || user.email}{" "}
                {user.is_teacher ? "(Преподаватель)" : "(Студент)"}
              </Text>
              <Button
                type="primary"
                danger
                icon={<LogoutOutlined />}
                onClick={handleLogout}
              >
                Выйти
              </Button>
            </>
          ) : (
            <Button
              type="primary"
              icon={<LoginOutlined />}
              onClick={() => navigate("/login")}
            >
              Войти
            </Button>
          )}
        </div>
      </Header>

      <Content style={{ padding: "24px" }}>
        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
          }}
        >
          {children}
        </div>
      </Content>
    </AntLayout>
  );
}
