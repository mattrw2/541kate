import { Disclosure, Dialog } from "@headlessui/react";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useLocation, Link } from "react-router-dom";
import { useCurrentUser } from "./UserContext";
import { apiUrl } from "./api";

const navigation = [
  { name: "Take a quiz", href: "/quizzes", pageName: "Quizzes" },
  { name: "Leave a review", href: "/review", pageName: "Reviews" },
  { name: "Relive my France trip", href: "/france", pageName: "France" },
  { name: "Rent a backpacker", href: "/rent-a-backpacker", pageName: "Rent a backpacker" },
  { name: "Challenges", href: "/challenges", pageName: "" },
];

const Shell = ({ children }) => {
  function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
  }

  const [page, setPage] = useState(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const { currentUser, setCurrentUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => fetch(`${apiUrl}/users`).then((r) => r.json()),
  });

  const location = useLocation();
  const currentPath = location.pathname;

  useEffect(() => {
    if (currentPath === "/") { setPage(""); return; }
    const found = navigation.find((p) => p.href === currentPath);
    if (found) setPage(found.pageName);
  }, [currentPath]);

  const handleUserChange = (e) => {
    if (e.target.value === "__new__") { setShowAddUser(true); return; }
    const selectedId = parseInt(e.target.value);
    if (!selectedId) { setCurrentUser(null); return; }
    const user = users.find((u) => u.id === selectedId);
    if (user) setCurrentUser(user);
  };

  const handleAddUser = async () => {
    if (!newUsername.trim()) return;
    const res = await fetch(`${apiUrl}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUsername.trim() }),
    });
    const user = await res.json();
    queryClient.invalidateQueries({ queryKey: ["users"] });
    setCurrentUser(user);
    setNewUsername("");
    setShowAddUser(false);
  };

  const userSelect = (
    <select
      value={currentUser?.id || ""}
      onChange={handleUserChange}
      className="font-medium text-sm border-2 border-yellow-400 rounded-lg px-3 py-1.5 bg-yellow-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400"
    >
      <option value="">Who are you?</option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>{u.username}</option>
      ))}
      <option value="__new__">+ Add user</option>
    </select>
  );

  return (
    <>
      <div className="min-h-full">
        <Disclosure as="nav" className="border-b border-gray-200 bg-white">
          {({ open }) => (
            <>
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 justify-between">
                  <div className="flex">
                    <div className="flex flex-shrink-0 items-center text-indigo-400 font-bold">
                      <Link to="/"> 541Kate.com</Link>
                    </div>
                    <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={classNames(
                            item.href === currentPath
                              ? "border-indigo-500 text-gray-900"
                              : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                            "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium"
                          )}
                          aria-current={item.href === currentPath ? "page" : undefined}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center">
                    {userSelect}
                  </div>
                  <div className="-mr-2 flex items-center sm:hidden">
                    <Disclosure.Button className="inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                      <span className="sr-only">Open main menu</span>
                      {open ? <XMarkIcon className="block h-6 w-6" aria-hidden="true" /> : <Bars3Icon className="block h-6 w-6" aria-hidden="true" />}
                    </Disclosure.Button>
                  </div>
                </div>
              </div>

              <Disclosure.Panel className="sm:hidden">
                <div className="space-y-1 pb-3 pt-2">
                  {navigation.map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as="a"
                      href={item.href}
                      className={classNames(
                        item.current
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-transparent text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800",
                        "block border-l-4 py-2 pl-3 pr-4 text-base font-medium"
                      )}
                      aria-current={item.current ? "page" : undefined}
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                  <div className="px-4 py-2">{userSelect}</div>
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>

        <div className="py-2">
          {page && (
            <header>
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900"> {page}</h1>
              </div>
            </header>
          )}
          <main>
            <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 py-2">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Add User modal */}
      <Dialog open={showAddUser} onClose={() => setShowAddUser(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-xl shadow-xl w-full max-w-xs p-6">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-lg font-light text-gray-800">Add user</Dialog.Title>
              <button onClick={() => setShowAddUser(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <input
              autoFocus
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddUser();
                if (e.key === "Escape") setShowAddUser(false);
              }}
              placeholder="Your name"
              className="font-thin text-sm border rounded px-2 py-1 w-full mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddUser(false)}
                className="font-thin text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="bg-transparent hover:bg-yellow-600 text-yellow-600 font-thin hover:text-white py-1.5 px-4 border border-yellow-600 hover:border-transparent rounded text-sm"
              >
                Add
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
};

export default Shell;
