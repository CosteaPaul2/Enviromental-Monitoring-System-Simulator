import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Icon } from "@iconify/react";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Pagination } from "@heroui/pagination";
import { formatDistanceToNow } from 'date-fns'
import AdminLayout from '@/layouts/AdminLayout'
import { adminApi, AdminUser } from '@/lib/adminApi'
import { useSuccessNotification, useErrorNotification } from '@/contexts/NotificationContext'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as "USER" | "ADMIN",
  });

  const addSuccessNotification = useSuccessNotification();
  const addErrorNotification = useErrorNotification();

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getUsers({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        role: roleFilter,
      });

      if (response.success && response.data) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      addErrorNotification("Failed to Load", "Could not fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      const response = await adminApi.createUser(newUser);

      if (response.success) {
        addSuccessNotification(
          "User Created",
          `${newUser.name} has been created successfully`,
        );
        setIsCreateModalOpen(false);
        setNewUser({ name: "", email: "", password: "", role: "USER" });
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to create user:", error);
      addErrorNotification("Creation Failed", "Could not create user");
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await adminApi.updateUser(selectedUser.id, {
        name: selectedUser.name,
        email: selectedUser.email,
        role: selectedUser.role,
      });

      if (response.success) {
        addSuccessNotification(
          "User Updated",
          `${selectedUser.name} has been updated successfully`,
        );
        setIsEditModalOpen(false);
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (error) {
      console.error("Failed to update user:", error);
      addErrorNotification("Update Failed", "Could not update user");
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      try {
        const response = await adminApi.deleteUser(user.id);

        if (response.success) {
          addSuccessNotification(
            "User Deleted",
            `${user.name} has been removed`,
          );
          fetchUsers();
        }
      } catch (error) {
        console.error("Failed to delete user:", error);
        addErrorNotification("Deletion Failed", "Could not delete user");
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-foreground/60 mt-1">
              Manage system users and permissions
            </p>
          </div>
          <Button
            color="primary"
            startContent={<Icon icon="tabler:user-plus" />}
            onPress={() => setIsCreateModalOpen(true)}
          >
            Create User
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardBody>
            <div className="flex gap-4">
              <Input
                className="flex-1"
                placeholder="Search by name or email..."
                startContent={<Icon icon="tabler:search" />}
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <Select
                className="w-48"
                items={[{ key: '', label: 'All Roles' }, { key: 'USER', label: 'User' }, { key: 'ADMIN', label: 'Admin' }]}
                placeholder="Filter by role"
                selectedKeys={roleFilter ? [roleFilter] : []}
                onSelectionChange={(value) => setRoleFilter(Array.from(value)[0] as string || '')}
              >
                {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
              </Select>
              <Button
                isLoading={loading}
                startContent={<Icon icon="tabler:refresh" />}
                variant="flat"
                onPress={fetchUsers}
              >
                Refresh
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold">Users ({users.length})</h3>
          </CardHeader>
          <CardBody>
            <Table aria-label="Users table">
              <TableHeader>
                <TableColumn>USER</TableColumn>
                <TableColumn>ROLE</TableColumn>
                <TableColumn>RESOURCES</TableColumn>
                <TableColumn>CREATED</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody isLoading={loading}>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-foreground/60">
                          {user.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Chip
                        color={user.role === 'ADMIN' ? 'warning' : 'primary'}
                        size="sm"
                        variant="flat"
                      >
                        {user.role}
                      </Chip>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-4 text-sm">
                        <span>{user._count.sensors} sensors</span>
                        <span>{user._count.shapes} areas</span>
                        <span>{user._count.accessTokens} sessions</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(user.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => {
                            setSelectedUser(user);
                            setIsEditModalOpen(true);
                          }}
                        >
                          <Icon icon="tabler:edit" />
                        </Button>
                        <Button
                          isIconOnly
                          color="danger"
                          size="sm"
                          variant="light"
                          onPress={() => handleDeleteUser(user)}
                        >
                          <Icon icon="tabler:trash" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex justify-center mt-4">
                <Pagination
                  page={currentPage}
                  total={totalPages}
                  onChange={setCurrentPage}
                />
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        size="md"
        onClose={() => setIsCreateModalOpen(false)}
      >
        <ModalContent>
          <ModalHeader>Create New User</ModalHeader>
          <ModalBody className="space-y-4">
            <Input
              label="Full Name"
              value={newUser.name}
              onValueChange={(value) => setNewUser({ ...newUser, name: value })}
            />
            <Input
              label="Email"
              type="email"
              value={newUser.email}
              onValueChange={(value) =>
                setNewUser({ ...newUser, email: value })
              }
            />
            <Input
              label="Password"
              type="password"
              value={newUser.password}
              onValueChange={(value) =>
                setNewUser({ ...newUser, password: value })
              }
            />
            <Select
              items={[{ key: 'USER', label: 'User' }, { key: 'ADMIN', label: 'Admin' }]}
              label="Role"
              selectedKeys={[newUser.role]}
              onSelectionChange={(value) => 
                setNewUser({ ...newUser, role: Array.from(value)[0] as 'USER' | 'ADMIN' })
              }
            >
              {(item) => <SelectItem key={item.key}>{item.label}</SelectItem>}
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color="primary"
              isDisabled={!newUser.name || !newUser.email || !newUser.password}
              onPress={handleCreateUser}
            >
              Create User
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        size="md"
        onClose={() => setIsEditModalOpen(false)}
      >
        <ModalContent>
          {selectedUser && (
            <>
              <ModalHeader>Edit User: {selectedUser.name}</ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  label="Full Name"
                  value={selectedUser.name}
                  onValueChange={(value) =>
                    setSelectedUser({ ...selectedUser, name: value })
                  }
                />
                <Input
                  label="Email"
                  type="email"
                  value={selectedUser.email}
                  onValueChange={(value) =>
                    setSelectedUser({ ...selectedUser, email: value })
                  }
                />
                <Select
                  items={[{ key: 'USER', label: 'User' }, { key: 'ADMIN', label: 'Admin' }]}
                  label="Role"
                  selectedKeys={[selectedUser.role]}
                  onSelectionChange={(value) => 
                    setSelectedUser({ ...selectedUser, role: Array.from(value)[0] as 'USER' | 'ADMIN' })
                  }
                >
                  {(item) => (
                    <SelectItem key={item.key}>{item.label}</SelectItem>
                  )}
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button color="primary" onPress={handleUpdateUser}>
                  Update User
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </AdminLayout>
  );
}
